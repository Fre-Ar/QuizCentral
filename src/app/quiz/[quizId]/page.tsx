"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUserContext } from "@/engine/hooks/useUserContext";
import { fetchQuizContext } from "@/lib/db-utils";
import { QuizContext } from "@/engine/session/types";
import { QuizProvider } from "@/engine/hooks/useQuizContext";
import { QuizRenderer } from "@/engine/core/Renderer";
import { useDragging } from '@/hooks/resizing';
import Header from '@/components/header';
import NavMenu from "@/components/NavHeader";
import DragHandle from '@/components/drag-handle';
import SidePanel from '@/components/SidePanel';
import { QuizEditor } from "@/engine/core/Editor";

export default function QuizPage() {
  const params = useParams();
  const quizId = params.quizId as string;
  
  // 4. Render Engine
  return (
    <QuizEditor tab={'create'} quizParamId={quizId}></QuizEditor>

  );
}