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
					
				} catch (error) {
					console.error("서비스 워커 등록 실패:", error);
				}
			});
		}
	}, []);

	return <></>;
}
