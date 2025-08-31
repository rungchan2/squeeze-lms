import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { MentionList } from './MentionList'
import { createClient } from '@/utils/supabase/client'
import { Editor, Range } from '@tiptap/core'

// 사용자 유형 정의
interface User {
  id: string
  email: string
  fullName: string
  avatarUrl?: string | null
}

// 데이터베이스 사용자 인터페이스
interface DbUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  profile_image: string | null
}

// 현재 여정 컨텍스트
let currentJourneyId: string | null = null
let cachedUsers: User[] = []
let currentUserRole: string | null = null

// Journey 컨텍스트 설정 함수 (개선됨)
export const setJourneyContext = async (journeyId: string) => {
  if (!journeyId) {
    console.error('유효하지 않은 여정 ID');
    return;
  }
  
  if (currentJourneyId !== journeyId) {
    currentJourneyId = journeyId
    cachedUsers = [] // 여정이 변경되면 캐시 초기화
    await getUsers() // 새 여정에 대한 사용자 목록 새로고침
  }
}

// 미션 인스턴스 컨텍스트 설정 함수 (호환성 유지)
export const setMissionInstanceContext = async (missionInstanceId: string) => {
  // For backward compatibility, treat as journey ID
  await setJourneyContext(missionInstanceId)
}

// 사용자 목록 가져오기 (개선된 버전)
const getUsers = async (): Promise<User[]> => {
  try {
    const supabase = createClient()
    
    // 1. 현재 사용자 인증 확인
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      // 비로그인 사용자는 멘션 불가
      return []
    }

    // 현재 사용자의 역할 확인
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    currentUserRole = currentProfile?.role || 'user'

    if (!currentJourneyId) {
      return []
    }

    // 이미 캐시된 사용자가 있으면 반환
    if (cachedUsers.length > 0) {
      return cachedUsers
    }
    
    let users: DbUser[] = []

    // Journey ID가 실제로 mission_instance_id인 경우 처리 (backward compatibility)
    let actualJourneyId = currentJourneyId
    
    // Check if it's a mission instance ID (UUID v4 format check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (uuidRegex.test(currentJourneyId)) {
      // Try to get journey_id from mission instance
      const { data: missionInstance } = await supabase
        .from('journey_mission_instances')
        .select('journey_id')
        .eq('id', currentJourneyId)
        .single()

      if (missionInstance?.journey_id) {
        actualJourneyId = missionInstance.journey_id
      }
    }

    // 2. 역할에 따라 사용자 목록 가져오기
    if (currentUserRole === 'admin' || currentUserRole === 'teacher') {
      // 어드민과 교사는 journey에 등록된 모든 사용자 + 모든 어드민/교사를 볼 수 있음
      
      // Journey에 등록된 사용자들
      const { data: journeyMembers } = await supabase
        .from('user_journeys')
        .select('user_id')
        .eq('journey_id', actualJourneyId)

      const journeyUserIds = journeyMembers?.map(m => m.user_id) || []

      // 모든 어드민과 교사
      const { data: staffProfiles } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, profile_image')
        .in('role', ['admin', 'teacher'])

      const staffIds = staffProfiles?.map(p => p.id) || []

      // 중복 제거한 사용자 ID 목록
      const allUserIds = [...new Set([...journeyUserIds, ...staffIds])]

      if (allUserIds.length > 0) {
        const { data: allUsers } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, profile_image')
          .in('id', allUserIds)

        users = allUsers || []
      }
    } else {
      // 일반 사용자는 같은 journey에 등록된 사용자만 볼 수 있음
      const { data: journeyMembers } = await supabase
        .from('user_journeys')
        .select('user_id')
        .eq('journey_id', actualJourneyId)

      if (journeyMembers && journeyMembers.length > 0) {
        const userIds = journeyMembers.map(member => member.user_id)
        const { data: journeyUsers } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name, profile_image')
          .in('id', userIds)

        users = journeyUsers || []
      }
    }

    // 결과 매핑 및 캐싱
    const formattedUsers = users.map((user: DbUser) => ({
      id: user.id,
      email: user.email,
      fullName: `${user.last_name || ''}${user.first_name || ''}`.trim() || user.email.split('@')[0],
      avatarUrl: user.profile_image
    }))

    cachedUsers = formattedUsers
    return formattedUsers
  } catch (error) {
    console.error('사용자 데이터 가져오기 오류:', error)
    return []
  }
}

interface MentionListRef {
  onKeyDown?: (props: any) => boolean;
}

const suggestionConfig = {
  items: async ({ query }: { query: string }) => {
    const users = await getUsers()
    
    // query가 undefined, null이거나 문자열이 아닌 경우 처리
    if (!query || typeof query !== 'string') {
      return users
    }
    
    const lowerCaseQuery = query.toLowerCase()
    return users.filter(user => 
      user.fullName.toLowerCase().includes(lowerCaseQuery) || 
      user.email.toLowerCase().includes(lowerCaseQuery)
    )
  },

  render: () => {
    let component: ReactRenderer | null = null
    let popup: any = null

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        })

        if (!props.clientRect) {
          return
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
          theme: 'light',
        })
      },

      onUpdate(props: any) {
        component?.updateProps(props)

        if (!props.clientRect) {
          return
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup?.[0].hide()
          return true
        }

        const ref = component?.ref as MentionListRef
        return ref?.onKeyDown?.(props) || false
      },

      onExit() {
        popup?.[0].destroy()
      },
    }
  },
  
  // @ 기호 입력 시 멘션 제안 활성화
  char: '@',

  // 선택된 항목을 멘션으로 변환
  command: ({ editor, range, props }: { 
    editor: Editor; 
    range: Range; 
    props: { id: string } 
  }) => {
    const userId = props.id;
    
    // 현재 선택된 사용자 찾기
    const selectedUser = cachedUsers.find(user => user.id === userId);
    
    if (!selectedUser) {
      return;
    }
    
    // 에디터에 멘션 삽입
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertContent([
        {
          type: 'mention',
          attrs: {
            id: selectedUser.id,
            label: selectedUser.fullName,
          },
        },
        {
          type: 'text',
          text: ' ', // 멘션 뒤에 공백 추가
        },
      ])
      .run();
  },

  // MentionList에서 선택된 항목이 Editor에 추가될 때 호출됨
  // 추가된 멘션 노드의 속성들을 정의
  addAttributes: () => {
    return {
      id: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-id'),
        renderHTML: (attributes: any) => {
          if (!attributes.id) {
            return {}
          }
          return {
            'data-id': attributes.id
          }
        }
      },
      label: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-label'),
        renderHTML: (attributes: any) => {
          if (!attributes.label) {
            return {}
          }
          return {
            'data-label': attributes.label
          }
        }
      }
    }
  }
}

export default suggestionConfig