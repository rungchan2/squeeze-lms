"use client";
import React, { useEffect } from "react";
import Head from "next/head";

export default function Pwa() {
	useEffect(() => {
		if ("serviceWorker" in navigator) {
			window.addEventListener("load", async function () {
				try {
					// 서비스 워커 등록 전에 기존 등록정보 확인
					const registrations = await navigator.serviceWorker.getRegistrations();
					for (let registration of registrations) {
						await registration.unregister();
						console.log("기존 서비스 워커 등록 해제:", registration.scope);
					}
					
					// 새 서비스 워커 등록
					const registration = await navigator.serviceWorker.register("/sw.js");
					console.log("Service Worker 등록 성공:", registration.scope);
				} catch (error) {
					console.error("Service Worker 등록 실패:", error);
				}
			});
		}
	}, []);

	return (
		<>
			<Head>
				<meta name="theme-color" content="#ff6f00" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="application-name" content="스퀴즈" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="스퀴즈" />
				<meta name="description" content="스퀴즈 학습 관리 시스템" />
				<meta name="format-detection" content="telephone=no" />
				<meta name="mobile-web-app-capable" content="yes" />
				<link rel="manifest" href="/manifest.webmanifest" />
				<link rel="apple-touch-icon" href="/apple-icon-180.png" />
			</Head>
		</>
	);
}