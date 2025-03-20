import { NextResponse } from "next/server";
import { getUserPointsByJourneyId } from "@/app/journey/actions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const journeyId = searchParams.get("journey_id");
    
    if (!journeyId) {
      return NextResponse.json(
        { error: "Journey ID is required" },
        { status: 400 }
      );
    }
    
    const { data, error } = await getUserPointsByJourneyId(Number(journeyId));
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error in user-points API:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 