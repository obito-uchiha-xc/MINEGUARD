/**
 * sirenAudio.ts
 * Web Audio API synthesizer for industrial mine control-room auditory alerts & SOS sirens.
 * Synthesizes an authentic, piercing emergency SOS call (... --- ...) in the laptop speakers.
 * Provides global hazard monitoring, auto-triggering on critical nodes, and immediate operator shut-off.
 */

import { useState, useEffect } from 'react';
import type { MapNode } from '../data/mock/nodes';

export interface HazardIncident {
  nodeId: string;
  nodeName: string;
  zone: string;
  panel: string;
  severity: 'CRITICAL' | 'HIGH_RISK';
  title: string;
  description: string;
  metrics: string;
  tarpLevel: string;
  triggeredAt: string;
}

export interface IndustrialAlarmState {
  isSounding: boolean;
  isSilenced: boolean;
  isMuted: boolean;
  audioBlockedByAutoplay: boolean;
  activeHazard: HazardIncident | null;
  silencedAt: string | null;
}

class IndustrialAudioSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isSosActive: boolean = false;
  private isSilenced: boolean = false;
  private silencedAt: string | null = null;
  private audioBlockedByAutoplay: boolean = false;
  private activeHazard: HazardIncident | null = null;
  private loopTimer: number | null = null;
  private activeOscs: OscillatorNode[] = [];
  private activeGains: GainNode[] = [];
  private listeners: Set<(state: IndustrialAlarmState) => void> = new Set();
  private gestureListenerAttached: boolean = false;

  constructor() {
    // Audio system initializes in standby without assuming any mock nodes or fake hazards
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        this.audioBlockedByAutoplay = true;
        this.notifyListeners();
      });
    }
    return this.ctx;
  }

  public getState(): IndustrialAlarmState {
    return {
      isSounding: this.isSosActive,
      isSilenced: this.isSilenced,
      isMuted: this.isMuted,
      audioBlockedByAutoplay: this.audioBlockedByAutoplay,
      activeHazard: this.activeHazard,
      silencedAt: this.silencedAt,
    };
  }

  public subscribe(listener: (state: IndustrialAlarmState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('Error in alarm listener:', err);
      }
    });
  }

  /**
   * Sets up gesture listeners so if the browser blocked audio playback on page load,
   * the very first click, tap, or keypress immediately resumes AudioContext and sounds the buzzer.
   */
  private setupGestureResume() {
    if (this.gestureListenerAttached || typeof window === 'undefined') return;
    this.gestureListenerAttached = true;

    const resumeHandler = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().then(() => {
          this.audioBlockedByAutoplay = false;
          if (this.activeHazard && !this.isSilenced && !this.isMuted) {
            this.startSosBuzzer();
          }
          this.notifyListeners();
        }).catch(() => {});
      } else {
        this.audioBlockedByAutoplay = false;
        if (this.activeHazard && !this.isSilenced && !this.isMuted && !this.isSosActive) {
          this.startSosBuzzer();
        }
        this.notifyListeners();
      }

      window.removeEventListener('pointerdown', resumeHandler);
      window.removeEventListener('keydown', resumeHandler);
      window.removeEventListener('touchstart', resumeHandler);
      this.gestureListenerAttached = false;
    };

    window.addEventListener('pointerdown', resumeHandler, { once: true });
    window.addEventListener('keydown', resumeHandler, { once: true });
    window.addEventListener('touchstart', resumeHandler, { once: true });
  }

  /**
   * Directly called when the operator clicks the banner to unlock audio
   */
  public async unlockAudioAndSound(): Promise<void> {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.warn('Could not resume audio context:', e);
      }
    }
    this.audioBlockedByAutoplay = false;
    if (this.activeHazard && !this.isSilenced && !this.isMuted) {
      this.startSosBuzzer();
    }
    this.notifyListeners();
  }

  /**
   * Evaluates a collection of nodes for hazardous conditions.
   * If any node is in CRITICAL or HIGH_RISK status, triggers the SOS alarm.
   */
  public evaluateNodesForHazard(nodes: MapNode[] = []) {
    // Find highest severity hazardous node (CRITICAL takes precedence over HIGH_RISK)
    const criticalNode =
      nodes.find((n) => n.status === 'CRITICAL') ||
      nodes.find((n) => n.status === 'HIGH_RISK');

    if (criticalNode) {
      const incident: HazardIncident = {
        nodeId: criticalNode.id,
        nodeName: criticalNode.name,
        zone: criticalNode.zone,
        panel: criticalNode.panel,
        severity: criticalNode.status as 'CRITICAL' | 'HIGH_RISK',
        title: `${criticalNode.name} — Hazardous Strata Condition Detected`,
        description: `Active geotechnical hazard on ${criticalNode.id}. Rate of displacement (${criticalNode.displacementMm} mm) and dynamic vibration (${criticalNode.vibrationMmS} mm/s) exceed safety thresholds.`,
        metrics: `Disp: ${criticalNode.displacementMm}mm | Tilt: ${criticalNode.tiltDeg}° | Vib: ${criticalNode.vibrationMmS}mm/s | Gas: ${criticalNode.gasStatus}`,
        tarpLevel: criticalNode.status === 'CRITICAL' ? 'TARP 3 (Mandatory Evacuation)' : 'TARP 2 (High Risk Exclusion)',
        triggeredAt: this.activeHazard?.triggeredAt || new Date().toLocaleTimeString('en-US', { hour12: false }),
      };

      this.activeHazard = incident;

      // If not already silenced by the operator and not muted, trigger buzzer
      if (!this.isSilenced && !this.isMuted) {
        const ctx = this.getContext();
        if (ctx && ctx.state === 'suspended') {
          this.audioBlockedByAutoplay = true;
          this.setupGestureResume();
        } else {
          this.startSosBuzzer();
        }
      }
      this.notifyListeners();
    } else {
      // No hazard present
      if (this.activeHazard) {
        this.activeHazard = null;
        this.stopSosBuzzer();
        this.notifyListeners();
      }
    }
  }

  /**
   * Operator command to immediately shut off / silence the alarm sound.
   */
  public silenceHazardAlarm() {
    this.stopSosBuzzer();
    this.isSilenced = true;
    this.silencedAt = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    this.notifyListeners();
  }

  /**
   * Operator command to re-arm the alarm system.
   * If a hazardous node remains active, the buzzer immediately sounds again.
   */
  public rearmHazardAlarm(nodes?: MapNode[]) {
    this.isSilenced = false;
    this.silencedAt = null;
    this.notifyListeners();
    if (nodes && nodes.length > 0) {
      this.evaluateNodesForHazard(nodes);
    }
  }

  /**
   * Manually trigger a hazard alarm for simulation / drill purposes
   */
  public triggerManualHazard(nodeId: string = 'NODE-01', customDetails?: Partial<HazardIncident>) {
    const incident: HazardIncident = {
      nodeId,
      nodeName: `Node ${nodeId}`,
      zone: 'Zone A',
      panel: 'Panel 1',
      severity: 'CRITICAL',
      title: `Node ${nodeId} — Drill / Test Alert`,
      description: 'Emergency strata acceleration triggered manually for system drill verification.',
      metrics: 'Disp: 14.8mm | Tilt: 3.2° | Vib: 5.6mm/s',
      tarpLevel: 'TARP 3 (Drill)',
      triggeredAt: new Date().toLocaleTimeString('en-US', { hour12: false }),
      ...customDetails,
    };

    this.activeHazard = incident;
    this.isSilenced = false;
    this.silencedAt = null;

    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      this.audioBlockedByAutoplay = true;
      this.setupGestureResume();
    } else {
      this.startSosBuzzer();
    }
    this.notifyListeners();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSosBuzzer();
    } else if (this.activeHazard && !this.isSilenced) {
      this.startSosBuzzer();
    }
    this.notifyListeners();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Starts an authentic industrial mine SOS emergency buzzer (... --- ...)
   * Buzzes continuously in rhythmic SOS cadence.
   */
  public startSosBuzzer() {
    if (this.isMuted || this.isSosActive) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.isSosActive = true;
    this.notifyListeners();

    // Morse Code Cadence:
    // S: dot, dot, dot
    // O: dash, dash, dash
    // S: dot, dot, dot
    const dotMs = 95;
    const dashMs = 270;
    const interElemMs = 55;
    const interLetterMs = 160;
    const interWordMs = 380;

    const sequence: { duration: number; pause: number }[] = [
      // S (...)
      { duration: dotMs, pause: interElemMs },
      { duration: dotMs, pause: interElemMs },
      { duration: dotMs, pause: interLetterMs },
      // O (---)
      { duration: dashMs, pause: interElemMs },
      { duration: dashMs, pause: interElemMs },
      { duration: dashMs, pause: interLetterMs },
      // S (...)
      { duration: dotMs, pause: interElemMs },
      { duration: dotMs, pause: interElemMs },
      { duration: dotMs, pause: interWordMs },
    ];

    let seqIndex = 0;

    const runLoop = () => {
      if (!this.isSosActive) return;

      const step = sequence[seqIndex];
      this.playTone(step.duration, () => {
        if (!this.isSosActive) return;
        seqIndex = (seqIndex + 1) % sequence.length;
        this.loopTimer = window.setTimeout(runLoop, step.pause);
      });
    };

    runLoop();
  }

  /**
   * Synthesizes a single high-penetration industrial emergency tone burst
   */
  private playTone(durationMs: number, onComplete: () => void) {
    const ctx = this.getContext();
    if (!ctx || !this.isSosActive) return;

    const now = ctx.currentTime;
    const durationSec = durationMs / 1000;

    // Dual-harmonic generator:
    // osc1 (sawtooth): industrial cutting frequency 850 Hz -> 920 Hz
    // osc2 (sine): 425 Hz foundation sub-tone for punch
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(850, now);
    osc1.frequency.linearRampToValueAtTime(920, now + durationSec);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(425, now);

    // Fast, crisp industrial envelope
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.012);
    gain.gain.setValueAtTime(0.18, now + durationSec - 0.012);
    gain.gain.linearRampToValueAtTime(0.001, now + durationSec);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + durationSec + 0.015);
    osc2.stop(now + durationSec + 0.015);

    this.activeOscs.push(osc1, osc2);
    this.activeGains.push(gain);

    window.setTimeout(() => {
      // Clean up finished references
      this.activeOscs = this.activeOscs.filter((o) => o !== osc1 && o !== osc2);
      this.activeGains = this.activeGains.filter((g) => g !== gain);
      onComplete();
    }, durationMs);
  }

  /**
   * Immediately silences the SOS buzzer and cancels all scheduled pulses
   */
  public stopSosBuzzer() {
    this.isSosActive = false;

    if (this.loopTimer !== null) {
      window.clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }

    if (this.ctx) {
      const now = this.ctx.currentTime;
      this.activeGains.forEach((gain) => {
        try {
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(0, now);
        } catch {
          // ignore
        }
      });
      this.activeOscs.forEach((osc) => {
        try {
          osc.stop(now);
        } catch {
          // ignore
        }
      });
    }

    this.activeOscs = [];
    this.activeGains = [];
    this.notifyListeners();
  }

  /**
   * Plays a quick test chime (single pulse)
   */
  public playTestChime() {
    this.startSosBuzzer();
    window.setTimeout(() => {
      this.stopSosBuzzer();
    }, 450);
  }

  /**
   * Plays a dual-frequency TARP Level 3 alert pulse
   */
  public playTarpSiren() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [0, 0.22, 0.44].forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(750, now + offset);
      osc.frequency.linearRampToValueAtTime(980, now + offset + 0.15);

      gain.gain.setValueAtTime(0.12, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.21);
    });
  }
}

export const industrialAudio = new IndustrialAudioSystem();

/**
 * Custom React Hook for components to subscribe reactively to the alarm state
 */
export function useHazardAlarm(): IndustrialAlarmState {
  const [state, setState] = useState<IndustrialAlarmState>(() => industrialAudio.getState());

  useEffect(() => {
    return industrialAudio.subscribe((newState) => {
      setState(newState);
    });
  }, []);

  return state;
}
