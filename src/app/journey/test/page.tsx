"use client";

import { useState } from "react";
import { getJourney } from "../clientActions";
import { useJourneyStore } from "@/store/journey";

export default function TestPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [uuid, setUuid] = useState<string>("483418d1-1a3b-4258-97cc-ac5302a63ad9"); // 테스트 UUID
  const [loading, setLoading] = useState(false);
  const { setCurrentJourneyUuid, getCurrentJourneyId } = useJourneyStore();

  async function testClientActions() {
    setLoading(true);
    setError(null);
    try {
      console.log("테스트 페이지: getJourney 호출 전");
      const journeyResult = await getJourney(uuid);
      console.log("테스트 페이지: getJourney 결과", journeyResult);
      setResult(journeyResult);
    } catch (e) {
      console.error("테스트 페이지: 에러 발생", e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function testJourneyStore() {
    setLoading(true);
    setError(null);
    try {
      console.log("테스트 페이지: setCurrentJourneyUuid 호출 전");
      setCurrentJourneyUuid(uuid);
      console.log("테스트 페이지: setCurrentJourneyUuid 호출 후");
      
      // 짧은 지연 후 ID 가져오기 시도
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("테스트 페이지: getCurrentJourneyId 호출 전");
      const id = await getCurrentJourneyId();
      console.log("테스트 페이지: getCurrentJourneyId 결과", id);
      setResult({ id });
    } catch (e) {
      console.error("테스트 페이지: 에러 발생", e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>API 테스트 페이지</h1>
      
      <div style={{ marginBottom: 20 }}>
        <label>
          UUID:
          <input 
            type="text" 
            value={uuid} 
            onChange={(e) => setUuid(e.target.value)} 
            style={{ marginLeft: 10, width: 300 }}
          />
        </label>
      </div>
      
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button onClick={testClientActions} disabled={loading}>
          clientActions.getJourney 테스트
        </button>
        <button onClick={testJourneyStore} disabled={loading}>
          JourneyStore 테스트
        </button>
      </div>
      
      {loading && <p>로딩 중...</p>}
      
      {error && (
        <div style={{ border: '1px solid red', padding: 10, marginBottom: 20 }}>
          <h3>에러:</h3>
          <pre>{error}</pre>
        </div>
      )}
      
      {result && (
        <div style={{ border: '1px solid #ccc', padding: 10 }}>
          <h3>결과:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
} 