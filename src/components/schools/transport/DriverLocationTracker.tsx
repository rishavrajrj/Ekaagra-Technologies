'use client';

/**
 * Driver Mobile Location Tracker
 * File: src/components/schools/transport/DriverLocationTracker.tsx
 *
 * Dedicated mobile-optimized interface for bus drivers to broadcast live GPS location
 * during active morning/afternoon transit trips.
 *
 * Architecture:
 * Driver Phone GPS ──► navigator.geolocation.watchPosition() ──► Supabase ──► Realtime Broadcast
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  Play,
  Square,
  AlertCircle,
  CheckCircle2,
  Clock,
  Radio,
  Wifi,
  WifiOff,
  Compass,
} from 'lucide-react';
import type { TransportRoute } from '@/lib/types';
import {
  startDriverLocationSharing,
  stopDriverLocationSharing,
  type LiveBusLocation,
} from '@/lib/services/liveLocationService';

interface DriverLocationTrackerProps {
  routes: TransportRoute[];
  schoolName?: string;
  driverName?: string;
  onTripEnd?: () => void;
}

export default function DriverLocationTracker({
  routes,
  schoolName = 'School Transport',
  driverName = 'Driver',
  onTripEnd,
}: DriverLocationTrackerProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || '');
  const [tripType, setTripType] = useState<'morning' | 'afternoon'>('morning');
  const [isTracking, setIsTracking] = useState(false);
  const [lastLocation, setLastLocation] = useState<LiveBusLocation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [updatesCount, setUpdatesCount] = useState(0);

  const stopSharingRef = useRef<(() => void) | null>(null);

  // Timer for elapsed trip duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, startTime]);

  // Clean up GPS tracking on unmount
  useEffect(() => {
    return () => {
      if (stopSharingRef.current) {
        stopSharingRef.current();
      }
    };
  }, []);

  const handleStartTrip = () => {
    setErrorMessage(null);

    if (!selectedRouteId) {
      setErrorMessage('Please select a route before starting the trip.');
      return;
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setErrorMessage('Browser Geolocation is not supported on this device.');
      return;
    }

    setStartTime(Date.now());
    setIsTracking(true);
    setUpdatesCount(0);

    const stopFn = startDriverLocationSharing(
      selectedRouteId,
      (loc) => {
        setLastLocation(loc);
        setUpdatesCount((prev) => prev + 1);
        setErrorMessage(null);
      },
      (err) => {
        setErrorMessage(err);
      }
    );

    stopSharingRef.current = stopFn;
  };

  const handleStopTrip = () => {
    if (stopSharingRef.current) {
      stopSharingRef.current();
      stopSharingRef.current = null;
    }
    stopDriverLocationSharing();
    setIsTracking(false);
    setStartTime(null);
    onTripEnd?.();
  };

  const selectedRoute = routes.find((r) => r.id === selectedRouteId);

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-sm">
            🚌
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Driver Transit Console
            </span>
            <h3 className="font-extrabold text-sm text-[#131B2E]">{schoolName}</h3>
          </div>
        </div>

        {/* Live Status Pill */}
        {isTracking ? (
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            GPS ACTIVE
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            STANDBY
          </span>
        )}
      </div>

      {/* Error / Notification Banner */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">GPS Warning</span>
            <p className="text-[11px] leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Route & Trip Selector (Disabled while trip is active) */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Route</label>
          <select
            disabled={isTracking}
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="w-full px-3 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-60 focus:bg-white focus:border-indigo-600 outline-hidden transition"
          >
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.routeName} {r.routeCode ? `(${r.routeCode})` : ''} — {r.stops?.length || 0} stops
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Trip Service Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isTracking}
              onClick={() => setTripType('morning')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                tripType === 'morning'
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Morning Pickup
            </button>
            <button
              type="button"
              disabled={isTracking}
              onClick={() => setTripType('afternoon')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                tripType === 'afternoon'
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Afternoon Drop
            </button>
          </div>
        </div>
      </div>

      {/* Active Trip Statistics Card */}
      {isTracking && (
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-950 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              Trip Duration
            </span>
            <span className="font-mono font-extrabold text-sm text-indigo-900">
              {formatElapsed(elapsedSeconds)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-100/80 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">GPS Accuracy</span>
              <span className="font-bold text-slate-800">
                {lastLocation?.accuracy ? `± ${Math.round(lastLocation.accuracy)} m` : 'Calibrating...'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-medium block">Updates Broadcast</span>
              <span className="font-bold text-slate-800">{updatesCount} packets</span>
            </div>
          </div>

          {lastLocation && (
            <div className="text-[10px] text-slate-500 pt-1 flex items-center justify-between">
              <span>Last ping: {new Date(lastLocation.recordedAt).toLocaleTimeString()}</span>
              {typeof lastLocation.speed === 'number' && (
                <span>Speed: {Math.round(lastLocation.speed * 3.6)} km/h</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Start / Stop Button */}
      <div>
        {!isTracking ? (
          <button
            type="button"
            onClick={handleStartTrip}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition cursor-pointer active:scale-98"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>START TRIP (BROADCAST GPS)</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStopTrip}
            className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/25 transition cursor-pointer active:scale-98"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>STOP TRIP (COMPLETE)</span>
          </button>
        )}
      </div>

      <div className="text-center">
        <span className="text-[10px] text-slate-400">
          Browser GPS sharing requires HTTPS on mobile devices.
        </span>
      </div>
    </div>
  );
}
