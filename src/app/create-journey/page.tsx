"use client"

import CreateJourneyFrom from "./CreateJourneyFrom";
import Forbidden from "@/components/auth/Forbidden";

export default function CreateJourneyPage() {
  return (
    <>
      <Forbidden requiredRole={["admin"]} />
      <CreateJourneyFrom />
    </>
  );
}