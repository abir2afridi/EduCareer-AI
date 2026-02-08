import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Mail, Phone, Star, StarHalf, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useTeacherDocument } from "@/hooks/useTeacherDocument";
import { useTeacherReviews } from "@/hooks/useTeacherReviews";
import { useAuth } from "@/components/auth-provider";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useToast } from "@/components/ui/use-toast";
import { submitTeacherReview } from "@/lib/firebaseHelpers";
import { useStudentTeacherHire } from "@/hooks/useStudentTeacherHire";

const MAX_RATING = 5;

const formatAverageRating = (reviews: ReturnType<typeof useTeacherReviews>["reviews"]) => {
  if (!reviews.length) return { average: 0, count: 0 };
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return { average: sum / reviews.length, count: reviews.length };
};

const renderStars = (value: number) => {
  const stars = [];
  for (let i = 1; i <= MAX_RATING; i += 1) {
    const diff = value - i + 1;
    if (diff >= 1) {
      stars.push(<Star key={i} className="h-4 w-4 fill-primary text-primary" />);
    } else if (diff > 0) {
      stars.push(<StarHalf key={i} className="h-4 w-4 fill-primary text-primary" />);
    } else {
      stars.push(<Star key={i} className="h-4 w-4 text-muted-foreground" />);
    }
  }
  return stars;
};

export default function TeacherProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { teacher, isLoading, error } = useTeacherDocument(id);
  const { reviews, isLoading: isReviewsLoading } = useTeacherReviews(id);
  const { profile } = useStudentProfile(user?.uid ?? null);
  const { hire } = useStudentTeacherHire(user?.uid ?? null, id ?? null);
  const { toast } = useToast();

  const [ratingInput, setRatingInput] = useState<string>("0");
  const [reviewInput, setReviewInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const studentReview = useMemo(() => reviews.find((review) => review.studentId === user?.uid), [reviews, user?.uid]);
  const { average, count } = useMemo(() => formatAverageRating(reviews), [reviews]);

  const canReview = Boolean(user && hire && hire.status === "active");

  useEffect(() => {
    if (studentReview) {
      setRatingInput(String(studentReview.rating));
      setReviewInput(studentReview.review);
    } else {
      setRatingInput("0");
      setReviewInput("");
    }
  }, [studentReview]);

  const handleSubmitReview = async () => {
    if (!user || !teacher || !id) {
      toast({ title: "Unable to submit review", description: "Please sign in and try again.", variant: "destructive" });
      return;
    }

    const ratingNumber = Number(ratingInput);
    if (!Number.isInteger(ratingNumber) || ratingNumber < 1 || ratingNumber > MAX_RATING) {
      toast({ title: "Invalid rating", description: "Please choose between 1 and 5 stars.", variant: "destructive" });
      return;
    }

    if (!reviewInput.trim()) {
      toast({ title: "Review required", description: "Share feedback about this teacher.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitTeacherReview(id, {
        studentId: user.uid,
        studentName: profile?.name ?? user.displayName ?? undefined,
        rating: ratingNumber,
        review: reviewInput.trim(),
      });

      toast({ title: "Review submitted", description: "Thanks for sharing your feedback!" });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to submit review.";
      toast({ title: "Submission failed", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-12 w-48 mb-6" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 md:col-span-2" />
        </div>
      </div>
    );
  }
  
  if (error || !teacher) {
    return (
      <div className="container mx-auto p-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Teachers
        </Button>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Teacher Unavailable</h1>
          <p className="text-muted-foreground">{error || "The requested teacher could not be found."}</p>
          <Button 
            onClick={() => navigate('/teachers')} 
            className="mt-4"
          >
            Back to Teachers List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Teachers
      </Button>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-shrink-0">
                <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-800 shadow-md">
                  {teacher.avatarUrl ? (
                    <AvatarImage src={teacher.avatarUrl} alt={teacher.teacherName} />
                  ) : (
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {teacher.teacherName
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")}
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-blue-500">Faculty Spotlight</p>
                  <h1 className="text-3xl font-bold tracking-tight">{teacher.teacherName}</h1>
                  <p className="text-lg text-muted-foreground">{teacher.subject}</p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {teacher.qualification && (
                    <Badge variant="secondary" className="px-3 py-1 text-xs">
                      {teacher.qualification}
                    </Badge>
                  )}
                  {teacher.experience && (
                    <Badge variant="outline" className="px-3 py-1 text-xs">
                      {teacher.experience}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full md:w-auto">
                {teacher.email && (
                  <Button variant="outline" size="sm" onClick={() => (window.location.href = `mailto:${teacher.email}`)}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                )}
                {teacher.experience && (
                  <Button variant="secondary" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Book a Session
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 md:col-span-2">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle>About {teacher.teacherName.split(" ")[0]}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">
                  {teacher.description || "No bio has been added yet."}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Professional Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Subject</p>
                  <p className="font-medium">{teacher.subject || "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Qualification</p>
                  <p className="font-medium">{teacher.qualification || "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Experience</p>
                  <p className="font-medium">{teacher.experience || "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                  <p className="font-medium break-all">{teacher.email || "—"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-sm">Email</span>
                  <span className="font-medium break-all">{teacher.email || "—"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-sm">Subject</span>
                  <span className="font-medium">{teacher.subject || "—"}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Student Reviews</CardTitle>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1 text-primary">
                      {renderStars(average)}
                    </div>
                    <span className="text-foreground font-medium">{average.toFixed(1)}</span>
                    <span>({count} {count === 1 ? "review" : "reviews"})</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isReviewsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reviews yet. Be the first to share your experience.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="rounded-2xl border border-border/60 bg-background/80 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{review.studentName ?? "Anonymous Student"}</p>
                            <p className="text-xs text-muted-foreground">
                              {review.createdAt?.toDate()?.toLocaleDateString() ?? "Recently"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-primary">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">{review.review}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <div className="w-full rounded-2xl border border-dashed border-border/60 bg-muted/40 p-4">
                  <h3 className="text-sm font-semibold text-foreground">Leave a review</h3>
                  {!user && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Please sign in to share your experience with this teacher.
                    </p>
                  )}
                  {user && !canReview && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      You need an approved hire with {teacher.teacherName.split(" ")[0]} to submit a review.
                    </p>
                  )}
                  {user && canReview && (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <label htmlFor="rating" className="text-sm font-medium text-muted-foreground">
                          Rating
                        </label>
                        <select
                          id="rating"
                          className="rounded-lg border border-border/60 bg-background px-3 py-1 text-sm"
                          value={ratingInput}
                          onChange={(event) => setRatingInput(event.target.value)}
                        >
                          <option value="0">Select rating</option>
                          {Array.from({ length: MAX_RATING }, (_, index) => index + 1).map((value) => (
                            <option key={value} value={value}>
                              {value} star{value > 1 ? "s" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <Textarea
                        placeholder="Describe your learning experience..."
                        value={reviewInput}
                        onChange={(event) => setReviewInput(event.target.value)}
                        className="min-h-[120px] rounded-xl border border-border/60 bg-background/80"
                      />
                      <Button className="rounded-xl" onClick={handleSubmitReview} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {studentReview ? "Update Review" : "Submit Review"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
