import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService, ProductReview } from "@/services/api/products";
import { useAuthStore } from "@/store/authStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "./RatingStars";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";
import { Loader2, Edit2, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProductReviewsProps {
  productId: string;
  className?: string;
}

export function ProductReviews({ productId, className }: ProductReviewsProps) {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [editingReview, setEditingReview] = useState<ProductReview | null>(null);
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Fetch reviews
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: () => productService.getReviews(productId),
  });

  // Fetch review stats
  const { data: stats } = useQuery({
    queryKey: ["product-review-stats", productId],
    queryFn: () => productService.getReviewStats(productId),
  });

  // Check if user already reviewed
  const { data: hasReviewed = false } = useQuery({
    queryKey: ["user-has-reviewed", productId],
    queryFn: () => productService.hasUserReviewed(productId),
    enabled: isAuthenticated,
  });

  // Add review mutation
  const addReviewMutation = useMutation({
    mutationFn: () => productService.addReview(productId, newRating, newComment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["product-review-stats", productId] });
      queryClient.invalidateQueries({ queryKey: ["user-has-reviewed", productId] });
      toast.success("Sharh qo'shildi!");
      setNewComment("");
      setNewRating(5);
      setShowForm(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update review mutation
  const updateReviewMutation = useMutation({
    mutationFn: () => {
      if (!editingReview) throw new Error("Sharh topilmadi");
      return productService.updateReview(editingReview.id, newRating, newComment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["product-review-stats", productId] });
      toast.success("Sharh yangilandi!");
      setEditingReview(null);
      setNewComment("");
      setNewRating(5);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete review mutation
  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: string) => productService.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["product-review-stats", productId] });
      queryClient.invalidateQueries({ queryKey: ["user-has-reviewed", productId] });
      toast.success("Sharh o'chirildi!");
      setDeleteReviewId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error("Sharh matnini kiriting");
      return;
    }
    if (editingReview) {
      updateReviewMutation.mutate();
    } else {
      addReviewMutation.mutate();
    }
  };

  const startEditing = (review: ProductReview) => {
    setEditingReview(review);
    setNewRating(review.rating);
    setNewComment(review.comment);
    setShowForm(true);
  };

  const cancelEditing = () => {
    setEditingReview(null);
    setNewComment("");
    setNewRating(5);
    setShowForm(false);
  };

  const isSubmitting = addReviewMutation.isPending || updateReviewMutation.isPending;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-bold">
            {stats?.averageRating.toFixed(1) || "0.0"}
          </div>
          <div>
            <RatingStars rating={stats?.averageRating || 0} size="md" />
            <p className="text-sm text-muted-foreground mt-0.5">
              {stats?.totalReviews || 0} ta sharh
            </p>
          </div>
        </div>
        {isAuthenticated && !hasReviewed && !showForm && (
          <Button onClick={() => setShowForm(true)} size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Sharh qoldirish
          </Button>
        )}
      </div>

      {/* Rating Distribution */}
      {stats && stats.totalReviews > 0 && (
        <div className="space-y-1">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingDistribution[rating] || 0;
            const percentage = (count / stats.totalReviews) * 100;
            return (
              <div key={rating} className="flex items-center gap-2 text-sm">
                <span className="w-3">{rating}</span>
                <RatingStars rating={1} maxRating={1} size="sm" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 rounded-lg bg-muted/50 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Bahongiz</label>
            <RatingStars
              rating={newRating}
              interactive
              onRatingChange={setNewRating}
              size="lg"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Sharhingiz</label>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Mahsulot haqida fikringizni yozing..."
              className="min-h-[100px] resize-none"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingReview ? (
                "Yangilash"
              ) : (
                "Sharh qo'shish"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={cancelEditing}>
              Bekor qilish
            </Button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Hozircha sharhlar yo'q</p>
            {isAuthenticated && !hasReviewed && (
              <p className="text-sm mt-1">Birinchi bo'lib sharh qoldiring!</p>
            )}
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="p-4 rounded-lg border border-border">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.user?.avatarUrl} />
                  <AvatarFallback>
                    {review.user?.fullName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{review.user?.fullName || "Foydalanuvchi"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <RatingStars rating={review.rating} size="sm" />
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(review.createdAt), {
                            addSuffix: true,
                            locale: uz,
                          })}
                        </span>
                      </div>
                    </div>
                    {user?.id === review.userId && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => startEditing(review)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteReviewId(review.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-foreground/90">{review.comment}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteReviewId} onOpenChange={() => setDeleteReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sharhni o'chirish?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu amal qaytarilmaydi. Sharh butunlay o'chiriladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteReviewId && deleteReviewMutation.mutate(deleteReviewId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
