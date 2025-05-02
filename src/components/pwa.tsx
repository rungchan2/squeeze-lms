"use client";
import React, { useEffect } from "react";

export default function Pwa() {
	useEffect(() => {
		if ("serviceWorker" in navigator) {
			window.addEventListener("load", async function () {
				try {
					// 커스텀 서비스 워커 등록
					const registration = await navigator.serviceWorker.register("/worker.js", {
						scope: "/"
					});
					console.log("커스텀 서비스 워커 등록 성공:", registration.scope);
					
					// Next.js PWA 서비스 워커도 등록 (workbox 기능 활성화)
					const swRegistration = await navigator.serviceWorker.register("/sw.js");
					console.log("Next.js PWA 서비스 워커 등록 성공:", swRegistration.scope);
				} catch (error) {
					console.error("서비스 워커 등록 실패:", error);
				}
			});
		}
	}, []);

	return <></>;
}
