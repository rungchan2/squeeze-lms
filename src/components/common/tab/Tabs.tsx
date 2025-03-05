"use client";

import { useState, useEffect } from "react";
import React from "react";
import styles from "./Tabs.module.css";
import Text from "@/components/Text/Text";
import { useRouter, useSearchParams } from "next/navigation";

interface TabProps {
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  path?: string;
}

interface TabsProps {
  children: React.ReactNode;
}

function Tab({ children }: TabProps) {
  return (
    <div className={styles.tab}>
      {children}
    </div>
  );
}

function Tabs({ children }: TabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams.get('tab');
  const [activeIndex, setActiveIndex] = useState<string | null>(currentTab);
  const tabs = React.Children.toArray(
    children
  ) as React.ReactElement<TabProps>[];

  useEffect(() => {
    setActiveIndex(currentTab);
  }, [currentTab]);

  // 첫 번째 탭의 path를 기본값으로 사용
  useEffect(() => {
    if (!activeIndex && tabs.length > 0 && tabs[0].props.path) {
      const defaultPath = tabs[0].props.path;
      setActiveIndex(defaultPath);
      
      // URL 파라미터 업데이트
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set('tab', defaultPath);
      router.push(`?${newParams.toString()}`);
    }
  }, [activeIndex, tabs, router, searchParams]);

  const handleTabClick = (path: string | undefined) => {
    if (path) {
      setActiveIndex(path);
      
      // URL 파라미터 업데이트
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set('tab', path);
      router.push(`?${newParams.toString()}`);
    }
  };

  // 현재 활성화된 탭 컨텐츠 찾기
  const activeTabContent = tabs.find(tab => tab.props.path === activeIndex);

  return (
    <div className={styles.container}>
      <div className={styles.tabButton}>
        {tabs.map((tab, index) => (
          <button
            key={index}
            onClick={() => handleTabClick(tab.props.path)}
            className={activeIndex === tab.props.path ? styles.active : ""}
          >
            {tab.props.icon}
            <Text variant="caption">
              {tab.props.title}
            </Text>
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {activeTabContent || tabs[0]}
      </div>
    </div>
  );
}

export { Tab, Tabs };
