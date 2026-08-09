"use client"

import { useSyncExternalStore } from "react"
import {
  getPresentationEvents,
  subscribePresentationEvents,
  type OverdrivePresentationEvent,
} from "./events"

const EMPTY: readonly OverdrivePresentationEvent[] = Object.freeze([])

export function usePresentationEvents(): readonly OverdrivePresentationEvent[] {
  return useSyncExternalStore(
    subscribePresentationEvents,
    getPresentationEvents,
    () => EMPTY,
  )
}
