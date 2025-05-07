self.addEventListener("push", async (e) => {
	try {
		const data = e.data.text();
		console.log("푸시 알림 데이터 수신:", data);
		
		const payload = JSON.parse(data);
		console.log("파싱된 페이로드:", payload);
		console.log("페이로드 타입:", typeof payload);
		console.log("페이로드 키:", Object.keys(payload));
		
		// 최대한 단순화된 필드 사용
		const title = payload.title || "스퀴즈 알림";
		const body = payload.body || "";
		const icon = payload.icon || "/apple-icon-180.png";
		const url = payload.url || "/";
		
		// 알림 표시 - 최소한의 옵션만 사용
		e.waitUntil(
			self.registration.showNotification(title, {
				body: body,
				icon: icon,
				data: { url }
			})
		);
	} catch (error) {
		console.error("푸시 알림 처리 오류:", error);
		// 오류 발생 시 기본 알림 표시 (단순화)
		e.waitUntil(
			self.registration.showNotification("스퀴즈 알림", {
				body: "새로운 알림이 도착했습니다."
			})
		);
	}
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	// 알림에 URL 데이터가 있으면 해당 URL로 이동
	const url = event.notification.data?.url || "/";

	// 이미 열린 창이 있는지 확인하고 포커스
	event.waitUntil(
		clients
			.matchAll({
				type: "window",
				includeUncontrolled: true
			})
			.then((clientList) => {
				// 이미 열린 창이 있으면 해당 창에 포커스
				for (const client of clientList) {
					if (client.url === url && "focus" in client) {
						return client.focus();
					}
				}
				// 열린 창이 없으면 새 창 열기
				if (clients.openWindow) {
					return clients.openWindow(url);
				}
			})
	);
});

// 서비스 워커 설치 이벤트
self.addEventListener("install", (event) => {
	console.log("서비스 워커 설치됨");
	self.skipWaiting();
});

// 서비스 워커 활성화 이벤트
self.addEventListener("activate", (event) => {
	console.log("서비스 워커 활성화됨");
	event.waitUntil(self.clients.claim());
}); 