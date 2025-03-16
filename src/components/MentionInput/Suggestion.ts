import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { createClient } from '@/utils/supabase/client'
import { User } from '@/types/users'


import MentionList from './MentionList'

// 사용자 목록 (실제로는 API에서 가져올 수 있음)
let users: User[] = [];

const getUsers = async () => {
  const { data } = await createClient().from('profiles').select('*');
  return data as User[];
}

getUsers().then((data) => {
  users = data;
});

const suggestionConfig = {
  items: ({ query }: { query: string }) => {
    return users
      .filter(item => item.first_name?.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 10)
      .map(user => {
        // 사용자 이름 표시 형식 (first_name + last_name)
        const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        return {
          id: user.id.toString(),
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          label: displayName || user.email
        };
      });
  },

  render: () => {
    let component: ReactRenderer
    let popup: any

    return {
      onStart: (props: any) => {
        // items 배열에서 label만 추출하여 MentionList에 전달
        const items = props.items.map((item: { label: string }) => item.label);
        
        component = new ReactRenderer(MentionList, {
          props: {
            ...props,
            items,
            command: ({ id }: { id: string }) => {
              const index = parseInt(id);
              const selectedItem = props.items[index];
              
              if (selectedItem) {
                props.command({ 
                  id: selectedItem.id,
                  label: selectedItem.label,
                  first_name: selectedItem.first_name
                });
              }
            },
          },
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
        })
      },

      onUpdate(props: any) {
        // items 배열에서 label만 추출하여 MentionList에 전달
        const items = props.items.map((item: { label: string }) => item.label);
        
        component.updateProps({
          ...props,
          items,
          command: ({ id }: { id: string }) => {
            const index = parseInt(id);
            const selectedItem = props.items[index];
            
            if (selectedItem) {
              props.command({ 
                id: selectedItem.id,
                label: selectedItem.label,
                first_name: selectedItem.first_name
              });
            }
          },
        })

        if (!props.clientRect) {
          return
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup[0].hide()
          return true
        }

        return (component.ref as any)?.onKeyDown(props)
      },

      onExit() {
        popup[0].destroy()
        component.destroy()
      },
    }
  },

  // @ 기호 입력 시 멘션 제안 활성화
  char: '@',
}

export default suggestionConfig