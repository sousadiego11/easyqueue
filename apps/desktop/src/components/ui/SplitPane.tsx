import type { ReactNode } from "react"
import {
  Group,
  Panel,
  Separator,
  useDefaultLayout,
} from "react-resizable-panels"



interface SplitPaneProps {
  children: [ReactNode, ReactNode]
  direction?: "horizontal" | "vertical"
  defaultSize?: number
  minSize?: number
  rightMinSize?: number
  storageKey: string
  leftId: string
  rightId: string
  className?: string
}

export function SplitPane({
  children,
  direction = "horizontal",
  defaultSize = 50,
  minSize = 10,
  storageKey,
  leftId,
  rightId,
  className,
}: SplitPaneProps) {
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    groupId: storageKey,
    storage: localStorage,
  })

  return (
    <Group orientation={direction} defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged} className={className}>
      <Panel id={leftId} defaultSize={defaultSize} minSize={minSize}>
        {children[0]}
      </Panel>

      <Separator className={direction === "vertical" ? "cursor-row-resize" : "cursor-col-resize"} />

      <Panel id={rightId} minSize={minSize}>
        {children[1]}
      </Panel>
    </Group>
  )
}