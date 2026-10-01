"use client";
import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AgentId,TicketFilters } from "@/lib/types";
const agentSlice=createSlice({name:"agent",initialState:{current:"agent-1" as AgentId},reducers:{setAgent:(s,a:PayloadAction<AgentId>)=>{s.current=a.payload}}});
const initialFilters:TicketFilters={status:"",priority:"",category:"",triage_decision:"",search:""};
const filtersSlice=createSlice({name:"filters",initialState:initialFilters,reducers:{setFilters:(_,a:PayloadAction<TicketFilters>)=>a.payload}});
export const {setAgent}=agentSlice.actions;export const {setFilters}=filtersSlice.actions;
export const store=configureStore({reducer:{agent:agentSlice.reducer,filters:filtersSlice.reducer}});
export type RootState=ReturnType<typeof store.getState>;export type AppDispatch=typeof store.dispatch;
