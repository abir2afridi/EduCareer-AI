import { useCallback, useEffect, useMemo, useState } from "react";
import { type CareerSurveyDocument, type CareerSurveyPayload, getCareerSurvey, saveCareerSurvey } from "@/lib/firebaseHelpers";

export type UseCareerSurveyResult = {
  survey: CareerSurveyDocument | null;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  hasSurvey: boolean;
  reload: () => Promise<void>;
  save: (payload: CareerSurveyPayload) => Promise<void>;
};

export function useCareerSurvey(uid?: string | null): UseCareerSurveyResult {
  const [survey, setSurvey] = useState<CareerSurveyDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadSurvey = useCallback(async () => {
    if (!uid) {
      setSurvey(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const snapshot = await getCareerSurvey(uid);
      setSurvey(snapshot);
    } catch (loadError) {
      console.error("Failed to load career survey", loadError);
      setError(loadError instanceof Error ? loadError : new Error("Unable to load survey"));
    } finally {
      setIsLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    void loadSurvey();
  }, [loadSurvey]);

  const save = useCallback(
    async (payload: CareerSurveyPayload) => {
      if (!uid) {
        throw new Error("You must be signed in to save your survey.");
      }

      setIsSaving(true);
      setError(null);
      try {
        await saveCareerSurvey(uid, payload);
        await loadSurvey();
      } catch (saveError) {
        console.error("Failed to save career survey", saveError);
        setError(saveError instanceof Error ? saveError : new Error("Unable to save survey"));
        throw saveError;
      } finally {
        setIsSaving(false);
      }
    },
    [uid, loadSurvey],
  );

  const reload = useCallback(async () => {
    await loadSurvey();
  }, [loadSurvey]);

  const hasSurvey = useMemo(() => {
    if (!survey) return false;
    const goals = Array.isArray(survey.careerGoals) ? survey.careerGoals : Array.isArray(survey.choices) ? survey.choices : [];
    return goals.length > 0;
  }, [survey]);

  return {
    survey,
    isLoading,
    isSaving,
    error,
    hasSurvey,
    reload,
    save,
  };
}
