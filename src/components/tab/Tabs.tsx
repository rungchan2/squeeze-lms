"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
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
  usePath?: boolean;
  hoverActiveColor?: string;
  defaultIndex?: number;
  flexDirection?: "row" | "column";
  variant?: "plain" | "underline";
  preserveContent?: boolean;
}

const Tab = memo(({ children }: TabProps) => {
  return (
    <div className={styles.tab}>
      {children}
    </div>
  );
});

Tab.displayName = 'Tab';

function Tabs({ 
  children, 
  usePath = false, 
  hoverActiveColor = "transparent",
  defaultIndex = 0,
  flexDirection = "row",
  preserveContent = false,
}: TabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams.get('tab');
  
  const [activeIndex, setActiveIndex] = useState<string | null>(
    usePath ? currentTab : String(defaultIndex)
  );
  
  const tabs = useMemo(() => {
    return React.Children.toArray(children) as React.ReactElement<TabProps>[];
  }, [children]);

  useEffect(() => {
    if (usePath && currentTab) {
      setActiveIndex(currentTab);
    }
  }, [currentTab, usePath]);

  useEffect(() => {
    if (usePath && !activeIndex && tabs.length > 0 && tabs[0].props.path) {
      const defaultPath = tabs[0].props.path;
      setActiveIndex(defaultPath);
      
      if (window.location.search !== `?tab=${defaultPath}`) {
        try {
          const newParams = new URLSearchParams(searchParams.toString());
          newParams.set('tab', defaultPath);
          const newUrl = `?${newParams.toString()}`;
          
          router.replace(newUrl, { scroll: false });
        } catch (error) {
          console.error("탭 라우팅 오류:", error);
        }
      }
    }
  }, [activeIndex, tabs, router, searchParams, usePath]);

  const handleTabClick = useCallback((path: string | undefined, index: number) => {
    if (usePath && path) {
      if (activeIndex === path) return;
      
      setActiveIndex(path);
      
      try {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set('tab', path);
        const newUrl = `?${newParams.toString()}`;
        
        router.replace(newUrl, { scroll: false });
      } catch (error) {
        console.error("탭 클릭 라우팅 오류:", error);
      }
    } else {
      setActiveIndex(String(index));
    }
  }, [activeIndex, router, searchParams, usePath]);

  const activeTabIndex = usePath 
    ? tabs.findIndex(tab => tab.props.path === activeIndex)
    : Number(activeIndex) || 0;
  
  const activeTabContent = activeTabIndex >= 0 ? tabs[activeTabIndex] : tabs[0];

  return (
    <div className={styles.container}>
      <div className={styles.tabButton}>
        {tabs.map((tab, index) => {
          const isActive = usePath 
            ? activeIndex === tab.props.path 
            : activeIndex === String(index);
            
          return (
            <button
              key={index}
              onClick={() => handleTabClick(tab.props.path, index)}
              className={isActive ? styles.active : ""}
              style={{
                backgroundColor: isActive ? hoverActiveColor : undefined, 
                cursor: 'pointer',
                flexDirection: flexDirection,
                color: isActive ? "var(--grey-700)" : "var(--grey-500)"
              }}
            >
              {tab.props.icon}
              <Text variant="caption">
                {tab.props.title}
              </Text>
            </button>
          );
        })}
      </div>

      <div className={styles.tabContent}>
        {preserveContent ? (
          tabs.map((tab, index) => (
            <div 
              key={index}
              style={{ 
                display: index === activeTabIndex ? 'block' : 'none' 
              }}
            >
              {tab}
            </div>
          ))
        ) : (
          activeTabContent
        )}
      </div>
    </div>
  );
}

export { Tab, Tabs };
