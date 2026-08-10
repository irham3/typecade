"use client"

import { useSyncExternalStore } from "react"
import {
  getPresentationEvents,
  getPresentationEnvelopes,
  subscribePresentationEvents,
  type OverdrivePresentationEvent,
} from "./events"
import type { PresentationEventEnvelope } from "./scheduler-types"

const EMPTY: readonly OverdrivePresentationEvent[] = Object.freeze([])

export function usePresentationEvents(): readonly OverdrivePresentationEvent[] {
  return useSyncExternalStore(
    subscribePresentationEvents,
    getPresentationEvents,
    () => EMPTY,
  )
}

const EMPTY_ENVELOPES: readonly PresentationEventEnvelope<OverdrivePresentationEvent>[] = Object.freeze([])

export function usePresentationEnvelopes(): readonly PresentationEventEnvelope<OverdrivePresentationEvent>[] {
  return useSyncExternalStore(
    subscribePresentationEvents,
    getPresentationEnvelopes,
    () => EMPTY_ENVELOPES,
  )
}
