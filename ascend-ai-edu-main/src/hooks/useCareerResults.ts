import { useEffect, useMemo, useState } from "react";
import {
  type CareerAssessmentRecord,
  type CareerQuizAttemptRecord,
  type CareerRecommendationRecord,
  listenToCareerAssessments,
  listenToCareerQuizAttempts,
  listenToCareerRecommendations,
} from "@/lib/firebaseHelpers";

export type UseCareerResultsResult = {
  assessments: CareerAssessmentRecord[];
  attempts: CareerQuizAttemptRecord[];
  recommendations: CareerRecommendationRecord[];
  latestAssessment: CareerAssessmentRecord | null;
  latestAttempt: CareerQuizAttemptRecord | null;
  latestRecommendation: CareerRecommendationRecord | null;
  isLoading: boolean;
};

export function useCareerResults(uid?: string | null): UseCareerResultsResult {
  const [assessments, setAssessments] = useState<CareerAssessmentRecord[]>([]);
  const [attempts, setAttempts] = useState<CareerQuizAttemptRecord[]>([]);
  const [recommendations, setRecommendations] = useState<CareerRecommendationRecord[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  useEffect(() => {
    if (!uid) {
      setAssessments([]);
      setAssessmentsLoading(false);
      return;
    }

    setAssessmentsLoading(true);
    const unsubscribe = listenToCareerAssessments(
      uid,
      (records) => {
        setAssessments(records);
        setAssessmentsLoading(false);
      },
      () => setAssessmentsLoading(false),
    );

    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    if (!uid) {
      setAttempts([]);
      setAttemptsLoading(false);
      return;
    }

    setAttemptsLoading(true);
    const unsubscribe = listenToCareerQuizAttempts(
      uid,
      (records) => {
        const careerOnly = records.filter((record) => (record.source ?? "careerGuidance") === "careerGuidance");
        setAttempts(careerOnly);
        setAttemptsLoading(false);
      },
      () => setAttemptsLoading(false),
    );

    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    if (!uid) {
      setRecommendations([]);
      setRecommendationsLoading(false);
      return;
    }

    setRecommendationsLoading(true);
    const unsubscribe = listenToCareerRecommendations(
      uid,
      (records) => {
        setRecommendations(records);
        setRecommendationsLoading(false);
      },
      () => setRecommendationsLoading(false),
    );

    return () => unsubscribe();
  }, [uid]);

  const latestAssessment = useMemo(() => assessments[0] ?? null, [assessments]);

  const latestRecommendation = useMemo(() => recommendations[0] ?? null, [recommendations]);

  const latestAttempt = useMemo(() => {
    if (!attempts.length) return null;
    if (latestRecommendation) {
      const matching = attempts.find((attempt) => attempt.assessmentId === latestRecommendation.assessmentId);
      if (matching) return matching;
    }
    if (latestAssessment) {
      const matching = attempts.find((attempt) => attempt.assessmentId === latestAssessment.id);
      if (matching) return matching;
    }
    return attempts[0] ?? null;
  }, [attempts, latestAssessment, latestRecommendation]);

  const isLoading = assessmentsLoading || attemptsLoading || recommendationsLoading;

  return {
    assessments,
    attempts,
    recommendations,
    latestAssessment,
    latestAttempt,
    latestRecommendation,
    isLoading,
  };
}
