import { useEffect, useMemo, useState } from "react";
import {
  type AdminCareerAssessmentRecord,
  type AdminCareerDocumentRecord,
  type AdminCareerQuizAttemptRecord,
  type AdminCareerRecommendationRecord,
  type AdminCareerSurveyRecord,
  listenToAllCareerAssessments,
  listenToAllCareerDocuments,
  listenToAllCareerQuizAttempts,
  listenToAllCareerRecommendations,
  listenToAllCareerSurveys,
} from "@/lib/firebaseHelpers";

export type AdminCareerGuidanceState = {
  documents: AdminCareerDocumentRecord[];
  assessments: AdminCareerAssessmentRecord[];
  attempts: AdminCareerQuizAttemptRecord[];
  recommendations: AdminCareerRecommendationRecord[];
  surveys: AdminCareerSurveyRecord[];
  studentIds: string[];
  isLoading: boolean;
};

export function useAdminCareerGuidance(): AdminCareerGuidanceState {
  const [documents, setDocuments] = useState<AdminCareerDocumentRecord[]>([]);
  const [assessments, setAssessments] = useState<AdminCareerAssessmentRecord[]>([]);
  const [attempts, setAttempts] = useState<AdminCareerQuizAttemptRecord[]>([]);
  const [recommendations, setRecommendations] = useState<AdminCareerRecommendationRecord[]>([]);
  const [surveys, setSurveys] = useState<AdminCareerSurveyRecord[]>([]);

  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);
  const [attemptsLoading, setAttemptsLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [surveysLoading, setSurveysLoading] = useState(true);

  useEffect(() => {
    setDocumentsLoading(true);
    const unsubscribe = listenToAllCareerDocuments(
      (records) => {
        setDocuments(records);
        setDocumentsLoading(false);
      },
      () => setDocumentsLoading(false),
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setAssessmentsLoading(true);
    const unsubscribe = listenToAllCareerAssessments(
      (records) => {
        setAssessments(records);
        setAssessmentsLoading(false);
      },
      () => setAssessmentsLoading(false),
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setAttemptsLoading(true);
    const unsubscribe = listenToAllCareerQuizAttempts(
      (records) => {
        setAttempts(records);
        setAttemptsLoading(false);
      },
      () => setAttemptsLoading(false),
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setRecommendationsLoading(true);
    const unsubscribe = listenToAllCareerRecommendations(
      (records) => {
        setRecommendations(records);
        setRecommendationsLoading(false);
      },
      () => setRecommendationsLoading(false),
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setSurveysLoading(true);
    const unsubscribe = listenToAllCareerSurveys(
      (records) => {
        setSurveys(records);
        setSurveysLoading(false);
      },
      () => setSurveysLoading(false),
    );

    return () => unsubscribe();
  }, []);

  const studentIds = useMemo(() => {
    const ids = new Set<string>();
    documents.forEach((doc) => ids.add(doc.userId));
    assessments.forEach((assessment) => ids.add(assessment.userId));
    attempts.forEach((attempt) => ids.add(attempt.userId));
    recommendations.forEach((recommendation) => ids.add(recommendation.userId));
    surveys.forEach((survey) => ids.add(survey.userId));
    return Array.from(ids).sort();
  }, [documents, assessments, attempts, recommendations, surveys]);

  const isLoading = documentsLoading || assessmentsLoading || attemptsLoading || recommendationsLoading || surveysLoading;

  return {
    documents,
    assessments,
    attempts,
    recommendations,
    surveys,
    studentIds,
    isLoading,
  };
}
