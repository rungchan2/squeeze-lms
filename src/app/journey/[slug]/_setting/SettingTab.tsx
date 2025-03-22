"use client";

import React, { useState } from "react";
import { IoMenu } from "react-icons/io5";
import styled from "@emotion/styled";
import Heading from "@/components/Text/Heading";
import Text from "@/components/Text/Text";
import { FaSchoolFlag } from "react-icons/fa6";
import { BsEnvelopeArrowUpFill } from "react-icons/bs";
import { FaUserGroup } from "react-icons/fa6";
import { Input, Separator } from "@chakra-ui/react";
import { AdminOnly, TeacherOnly } from "@/components/auth/AdminOnly";
import { FaChalkboardTeacher } from "react-icons/fa";
import { CgPassword } from "react-icons/cg";
import { RiAdminFill } from "react-icons/ri";
import Link from "next/link";
import { Button, CloseButton, Dialog, Portal } from "@chakra-ui/react";
import { Clipboard } from "@chakra-ui/react";
import { FaCheck, FaRegCopy } from "react-icons/fa6";
import { InputGroup } from "@/components/ui/input-group";
import { Table } from "@chakra-ui/react";
import useAccessCode from "@/hooks/useAccessCode";
import dayjs from "@/utils/dayjs/dayjs";
import constants from "@/utils/contansts";
import { IoIosBookmarks } from "react-icons/io";
import { MdOutlinePrivacyTip, MdPolicy, MdUpdate } from "react-icons/md";


export default function SettingTab({ slug }: { slug: string }) {
  const { accessCodes, deleteAccessCode } = useAccessCode();
  const filterAccessCodes = accessCodes?.filter(
    (code) => code.role === "teacher"
  );
  return (
    <SettingTabContainer>
      <div>
        <div className="large-container-main">
          <div className="first-heading">
            <Heading level={3}>설정</Heading>
            <Text variant="body" color="var(--grey-500)">
              클라스 설정을 변경하는 곳입니다.
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
                  (선생님만 접근 가능)
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
                      <Dialog.Content css={{ position: "relative" }}>
                        <Dialog.Header>
                          <Dialog.Title>회원가입 코드</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                          <Table.Root
                            key={"access-code"}
                            size={"sm"}
                            interactive
                          >
                            <Table.Header>
                              <Table.Row>
                                <Table.ColumnHeader>만료일</Table.ColumnHeader>
                                <Table.ColumnHeader>권한</Table.ColumnHeader>
                                <Table.ColumnHeader>코드</Table.ColumnHeader>
                              </Table.Row>
                            </Table.Header>
                            <Table.Body>
                              {filterAccessCodes?.map((code) => (
                                <Table.Row key={code.id}>
                                  <Table.Cell>
                                    {dayjs(code.expiry_date).format("YYYY-MM-DD a h:m")}
                                  </Table.Cell>
                                  <Table.Cell>
                                    {code.role === "teacher"
                                      ? "선생님"
                                      : "학생"}
                                  </Table.Cell>
                                  <Table.Cell>
                                    <CopyInput value={code.code} />
                                  </Table.Cell>
                                </Table.Row>
                              ))}
                            </Table.Body>
                          </Table.Root>
                        </Dialog.Body>
                        <Dialog.Footer>
                          <Dialog.ActionTrigger asChild>
                            <Button variant="outline">취소</Button>
                          </Dialog.ActionTrigger>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger asChild>
                          <CloseButton
                            size="sm"
                            css={{
                              position: "absolute",
                              top: "1rem",
                              right: "1rem",
                              zIndex: 10,
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
                <MenuItem href={`/journey/${slug}/teacher/posts`}>
                  <FaUserGroup />
                  <Text
                    variant="body"
                    color="var(--grey-700)"
                    fontWeight="medium"
                  >
                    제출된 과제 관리
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
              <MenuItemDiv onClick={() => window.open(constants.GUIDE_URL, "_blank")}>
                <IoIosBookmarks />
                <Text
                  variant="body"
                  color="var(--grey-700)"
                  fontWeight="medium"
                >
                  스퀴즈 사용방법
                </Text>
              </MenuItemDiv>
              <MenuItemDiv onClick={() => window.open(constants.TERMS_OF_SERVICE_URL, "_blank")}>
                <MdOutlinePrivacyTip />
                <Text
                  variant="body"
                  color="var(--grey-700)"
                  fontWeight="medium"
                >
                  서비스 이용약관
                </Text>
              </MenuItemDiv>
              <MenuItemDiv onClick={() => window.open(constants.PRIVACY_POLICY_URL, "_blank")}>
                <MdPolicy />
                <Text
                  variant="body"
                  color="var(--grey-700)"
                  fontWeight="medium"
                >
                  개인정보 처리방침
                </Text>
              </MenuItemDiv>
              <MenuItemDiv onClick={() => window.open(constants.SERVICE_UPDATE_URL, "_blank")}>
                <MdUpdate />
                <Text
                  variant="body"
                  color="var(--grey-700)"
                  fontWeight="medium"
                >
                  서비스 업데이트 내역
                </Text>
              </MenuItemDiv>
            </div>
          </div>
        </div>
      </div>
    </SettingTabContainer>
  );
}
const CopyInput = ({ value }: { value: string }) => {
  return (
    <Clipboard.Root maxW="100%" value={value}>
      <InputGroup endElement={<ClipboardIconButton value={value} />}>
        <Clipboard.Input asChild>
          <Input maxW="100%" />
        </Clipboard.Input>
      </InputGroup>
    </Clipboard.Root>
  );
};

export const ClipboardIconButton = ({ value }: { value: string }) => {
  const [isCopied, setIsCopied] = useState(false);
  const handleCopy = () => {
    setIsCopied(true);
    navigator.clipboard.writeText(value);
    setTimeout(() => {
      setIsCopied(false);
    }, 1000);
  };
  return (
    <Clipboard.Root value={value}>
      <Clipboard.Trigger asChild>
        <div
          style={{
            cursor: "pointer",
            backgroundColor: "var(--grey-100)",
            padding: "8px",
            borderRadius: "4px",
          }}
          onClick={handleCopy}
        >
          {isCopied ? <FaCheck /> : <FaRegCopy />}
        </div>
      </Clipboard.Trigger>
    </Clipboard.Root>
  );
};

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
