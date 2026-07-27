"use client";

import * as React from "react";

import { cn } from "@/lib/utils";


type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};


const TabsContext =
  React.createContext<TabsContextValue | null>(
    null,
  );


type TabsProps = {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
};


export function Tabs({
  defaultValue = "",
  value: controlledValue,
  onValueChange,
  children,
  className,
}: TabsProps) {

  const [internalValue, setInternalValue] =
    React.useState(defaultValue);

  const value =
    controlledValue ?? internalValue;

  function setValue(nextValue: string) {
    if (onValueChange) {
      onValueChange(nextValue);
      return;
    }

    setInternalValue(nextValue);
  }

  return (
    <TabsContext.Provider
      value={{
        value,
        setValue,
      }}
    >
      <div className={cn(className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}


type TabsListProps = {
  children: React.ReactNode;
  className?: string;
};


export function TabsList({
  children,
  className,
}: TabsListProps) {
  return (
    <div
      className={cn(
        "flex w-full gap-1 overflow-x-auto rounded-xl bg-muted p-1",
        className,
      )}
    >
      {children}
    </div>
  );
}


type TabsTriggerProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
};


export function TabsTrigger({
  value,
  children,
  className,
}: TabsTriggerProps) {
  const context =
    React.useContext(TabsContext);

  if (!context) {
    throw new Error(
      "TabsTrigger must be used inside Tabs",
    );
  }

  const active =
    context.value === value;

  return (
    <button
      type="button"
      onClick={() =>
        context.setValue(value)
      }
      className={cn(
        "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-background shadow-sm"
          : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}


type TabsContentProps = {
  value: string;
  children: React.ReactNode;
  className?: string;
};


export function TabsContent({
  value,
  children,
  className,
}: TabsContentProps) {
  const context =
    React.useContext(TabsContext);

  if (!context) {
    throw new Error(
      "TabsContent must be used inside Tabs",
    );
  }

  if (context.value !== value) {
    return null;
  }

  return (
    <div className={cn(className)}>
      {children}
    </div>
  );
}