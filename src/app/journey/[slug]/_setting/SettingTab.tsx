"use client";

import React from "react";
import { IoMenu } from "react-icons/io5";
import styled from "@emotion/styled";
import Heading from "@/components/Text/Heading";
import Text from "@/components/Text/Text";
import { FaSchoolFlag } from "react-icons/fa6";
import { BsEnvelopeArrowUpFill } from "react-icons/bs";
import { FaUserGroup } from "react-icons/fa6";
import { Separator } from "@chakra-ui/react";
import { AdminOnly, TeacherOnly } from "@/components/auth/AdminOnly";
import { FaChalkboardTeacher } from "react-icons/fa";
import { CgPassword } from "react-icons/cg";
import { RiAdminFill } from "react-icons/ri";
import Link from "next/link";
import {
  Button,
  CloseButton,
  Dialog,
  Portal,
} from "@chakra-ui/react";

export default function SettingTab({ slug }: { slug: string }) {
  return (
    <SettingTabContainer>
      <div>
        <div className="large-container-main">
          <div className="first-heading">
            <Heading level={3}>설정</Heading>
            <Text variant="body" color="var(--grey-500)">
              이곳에서 클라스 설정을 변경할 수 있습니다.
            </Text>
          </div>
          <Separator size="md" />
          <AdminOnly>
            <div className="upper-container-main">
              <div className="heading">
                <RiAdminFill size={24} />
                <Heading level={4}>어드민 설정</Heading>
              </div>
              <div className="menu-items">
                <MenuItem href="/admin">
                  <FaSchoolFlag />
                  <Text
                    variant="body"
                    color="var(--grey-700)"
                    fontWeight="medium"
                  >
                    권한 설정
                  </Text>
                </MenuItem>
              </div>
            </div>
          </AdminOnly>
          <TeacherOnly>
            <div className="upper-container-main">
              <div className="heading">
                <FaChalkboardTeacher size={24} />
                <Heading level={4}>클라스 설정</Heading>
                <Text variant="caption" color="var(--grey-500)">
                  (선생님에게만 이 설정이 표시됩니다.)
                </Text>
              </div>
              <div className="menu-items">
                <MenuItem href={`/journey/${slug}/edit`}>
                  <FaSchoolFlag />
                  <Text
                    variant="body"
                    color="var(--grey-700)"
                    fontWeight="medium"
                  >
                    클라스 수정 및 삭제
                  </Text>
                </MenuItem>
                <MenuItem href={`/journey/${slug}/users`}>
                  <BsEnvelopeArrowUpFill />
                  <Text
                    variant="body"
                    color="var(--grey-700)"
                    fontWeight="medium"
                  >
                    클라스 초대 및 강퇴
                  </Text>
                </MenuItem>

                <Dialog.Root
                  key={"center"}
                  placement={"center"}
                  motionPreset="slide-in-bottom"
                >
                  <Dialog.Trigger asChild>
                    <MenuItemDiv>
                      <CgPassword />
                      <Text
                        variant="body"
                        color="var(--grey-700)"
                        fontWeight="medium"
                      >
                        회원가입 코드 발급
                      </Text>
                    </MenuItemDiv>
                  </Dialog.Trigger>
                  <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                      <Dialog.Content css={{ position: 'relative' }}>
                        <Dialog.Header>
                          <Dialog.Title>Dialog Title</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                          {/* TODO:회원가입 코드 발급 페이지 */}
                        </Dialog.Body>
                        <Dialog.Footer>
                          <Dialog.ActionTrigger asChild>
                            <Button variant="outline">Cancel</Button>
                          </Dialog.ActionTrigger>
                          <Button>Save</Button>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger asChild>
                          <CloseButton 
                            size="sm" 
                            css={{ 
                              position: 'absolute', 
                              top: '1rem', 
                              right: '1rem',
                              zIndex: 10 
                            }} 
                          />
                        </Dialog.CloseTrigger>
                      </Dialog.Content>
                    </Dialog.Positioner>
                  </Portal>
                </Dialog.Root>
                <MenuItem href={`/journey/${slug}/users`}>
                  <FaUserGroup />
                  <Text
                    variant="body"
                    color="var(--grey-700)"
                    fontWeight="medium"
                  >
                    멤버 관리
                  </Text>
                </MenuItem>
              </div>
            </div>
          </TeacherOnly>
          <div className="upper-container-main">
            <div className="heading">
              <IoMenu size={24} />
              <Heading level={4}>공통설정</Heading>
            </div>
            <div className="menu-items">
              <MenuItem href={`/journey/${slug}/info`}>
                <FaUserGroup />
                <Text
                  variant="body"
                  color="var(--grey-700)"
                  fontWeight="medium"
                >
                  클라스 정보
                </Text>
              </MenuItem>
              <MenuItem href={`/journey/${slug}/invite`}>
                <BsEnvelopeArrowUpFill />
                <Text
                  variant="body"
                  color="var(--grey-700)"
                  fontWeight="medium"
                >
                  다른 친구 초대
                </Text>
              </MenuItem>
              <MenuItemDiv>
                <FaUserGroup />
                <Text
                  variant="body"
                  color="var(--grey-700)"
                  fontWeight="medium"
                >
                  이 클라스 나가기
                </Text>
              </MenuItemDiv>
            </div>
          </div>
        </div>
      </div>
    </SettingTabContainer>
  );
}

const SettingTabContainer = styled.div`
  max-width: var(--breakpoint-tablet);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  .large-container-main {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .first-heading {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
  }

  .upper-container-main {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .heading {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .menu-items {
      background-color: var(--white);
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      border-radius: 10px;
    }
  }
`;

const MenuItem = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  border-radius: 10px;
  &:hover {
    background-color: var(--grey-100);
  }
`;
const MenuItemDiv = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  border-radius: 10px;
  &:hover {
    background-color: var(--grey-100);
  }
`;
