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
let currentMissionInstanceId: string | null = null
let cachedUsers: User[] = []

// 미션 인스턴스 컨텍스트 설정 함수
export const setMissionInstanceContext = async (missionInstanceId: string) => {
  if (!missionInstanceId) {
    console.error('유효하지 않은 미션 인스턴스 ID');
    return;
  }
  
  if (currentMissionInstanceId !== missionInstanceId) {
    currentMissionInstanceId = missionInstanceId
    cachedUsers = [] // 여정이 변경되면 캐시 초기화
    await getUsers() // 새 여정에 대한 사용자 목록 새로고침
  }
}

// journeyId를 기반으로 미션 인스턴스 컨텍스트 설정 (호환성 유지)
export const setJourneyContext = async (journeyId: string) => {
  if (!journeyId) {
    console.error('유효하지 않은 여정 ID');
    return;
  }
  
  // 사실 journeyId가 여기서는 missionInstanceId로 사용됨
  // 추후에는 여정 ID로부터 미션 인스턴스 ID를 조회하는 로직을 추가할 수 있음
  await setMissionInstanceContext(journeyId)
}

// 사용자 목록 가져오기
const getUsers = async (): Promise<User[]> => {
  try {
    if (!currentMissionInstanceId) {
      return []
    }

    // 이미 캐시된 사용자가 있으면 반환
    if (cachedUsers.length > 0) {
      return cachedUsers
    }
    
    const supabase = createClient()

    // 1. 미션 인스턴스로부터 journey_id 가져오기
    const { data: missionInstance, error: missionError } = await supabase
      .from('journey_mission_instances')
      .select('journey_id')
      .eq('id', currentMissionInstanceId)
      .single()

    if (missionError || !missionInstance) {
      console.error('미션 인스턴스 조회 오류:', missionError)
      return []
    }

    const journeyUuid = missionInstance.journey_id

    // 2. journey_uuid로 참여자 목록 가져오기
    // NULL 체크 추가
    if (!journeyUuid) {
      console.error('여정 UUID가 null입니다')
      return []
    }

    const { data: journeyMembers, error: membersError } = await supabase
      .from('user_journeys')
      .select('user_id')
      .eq('journey_id', journeyUuid)

    if (membersError) {
      console.error('여정 멤버 조회 오류:', membersError)
      return []
    }

    if (!journeyMembers || journeyMembers.length === 0) {
      return []
    }

    // 3. 멤버의 사용자 정보 가져오기
    const userIds = journeyMembers.map(member => member.user_id)
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, profile_image')
      .in('id', userIds)

    if (usersError) {
      console.error('사용자 정보 조회 오류:', usersError)
      return []
    }

    if (!users || users.length === 0) {
      return []
    }

    // 결과 매핑 및 캐싱
    const formattedUsers = users.map((user: DbUser) => ({
      id: user.id,
      email: user.email,
      fullName: `${user.last_name}${user.first_name}`.trim(),
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
        component?.destroy()
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