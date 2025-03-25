"use client";
import { Suspense, useEffect, useState, useCallback, memo } from "react";
import Text from "@/components/Text/Text";
import Heading from "@/components/Text/Heading";
import { useRouter } from "next/navigation";
import { getJourney } from "../../clientActions";
import Spinner from "@/components/common/Spinner";
import { useWeeks } from "@/hooks/useWeeks";
import styled from "@emotion/styled";
import WeekCard from "./WeekCard";
import { AdminOnly } from "@/components/auth/AdminOnly";
import { FloatingButton } from "@/components/common/FloatingButton";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { useSearchParams } from "next/navigation";
import { toaster } from "@/components/ui/toaster";
import Footer from "@/components/common/Footer";
import Button from "@/components/common/Button";
import { Modal } from "@/components/modal/Modal";
import { useJourneyMissionInstances } from "@/hooks/useJourneyMissionInstances";
import MissionCard from "./MissionCard";

export default function PlanTab({ slug }: { slug: string }) {


  return (
    <PlanContainer>
      <div className="header">
        <Heading level={3}>여행 일정</Heading>
        <Heading level={3}>{slug}</Heading>
      </div>
      <div className="weeks-list">
        
      </div>
      <Footer />
    </PlanContainer>
  );
}


const PlanContainer = styled.div`
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .add-button {
    padding: 0.5rem 1rem;
    background-color: var(--blue-500);
    color: var(--white);
    border-radius: 0.25rem;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--blue-600);
    }
  }

  .weeks-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .empty-state {
    text-align: center;
    padding: 2rem 0;
  }
`;
