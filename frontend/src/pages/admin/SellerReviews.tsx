import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import {
    Star,
    Loader2,
    Search,
    MessageSquare,
    ThumbsUp,
    Flag,
    MoreVertical,
    TrendingUp,
    Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

interface Review {
    id: string;
    product_id: string;
    user_id: string;
    rating: number;
    comment: string;
    created_at: string;
    product?: {
        title: string;
        media?: { url: string }[];
    };
    user?: {
        full_name: string;
        avatar_url?: string;
    };
}

export default function SellerReviews() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [ratingFilter, setRatingFilter] = useState<string>("all");
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [replyDialogOpen, setReplyDialogOpen] = useState(false);
    const [replyText, setReplyText] = useState("");

    const [stats, setStats] = useState({
        averageRating: 0,
        totalReviews: 0,
        fiveStars: 0,
        fourStars: 0,
        threeStars: 0,
        twoStars: 0,
        oneStar: 0,
    });

    useEffect(() => {
        if (!user || (user.role !== 'blogger' && user.role !== 'super_admin' && user.role !== 'seller')) {
            navigate("/");
            return;
        }

        fetchReviews();
    }, [user, navigate]);

    useEffect(() => {
        filterReviews();
    }, [reviews, searchQuery, ratingFilter]);

    const fetchReviews = async () => {
        try {
            setLoading(true);

            // Fetch seller's products
            const { data: products, error: productsError } = await supabase
                .from('products')
                .select('id')
                .eq('seller_id', user!.id);

            if (productsError) throw productsError;

            const productIds = products?.map(p => p.id) || [];

            if (productIds.length === 0) {
                setReviews([]);
                setFilteredReviews([]);
                setLoading(false);
                return;
            }

            // Fetch reviews (Note: product_comments table structure)
            const { data: reviewsData, error: reviewsError } = await supabase
                .from('product_comments')
                .select(`
                    *,
                    products!product_id(title, media:product_media(url)),
                    profiles!user_id(full_name, avatar_url)
                `)
                .in('product_id', productIds)
                .order('created_at', { ascending: false });

            if (reviewsError) throw reviewsError;

            // Calculate stats
            const totalReviews = reviewsData?.length || 0;
            let sumRatings = 0;
            let fiveStars = 0, fourStars = 0, threeStars = 0, twoStars = 0, oneStar = 0;

            reviewsData?.forEach(review => {
                sumRatings += review.rating || 0;
                const rating = review.rating || 0;
                if (rating === 5) fiveStars++;
                else if (rating === 4) fourStars++;
                else if (rating === 3) threeStars++;
                else if (rating === 2) twoStars++;
                else if (rating === 1) oneStar++;
            });

            setStats({
                averageRating: totalReviews > 0 ? sumRatings / totalReviews : 0,
                totalReviews,
                fiveStars,
                fourStars,
                threeStars,
                twoStars,
                oneStar,
            });

            // Map to Review interface
            const mappedReviews: Review[] = (reviewsData as any[] || []).map(r => ({
                id: r.id,
                product_id: r.product_id,
                user_id: r.user_id,
                rating: r.rating || 0,
                comment: r.text || '',
                created_at: r.created_at,
                product: r.products ? {
                    title: r.products.title,
                    media: r.products.media
                } : undefined,
                user: r.profiles ? {
                    full_name: r.profiles.full_name,
                    avatar_url: r.profiles.avatar_url
                } : undefined,
            }));

            setReviews(mappedReviews);
            setFilteredReviews(mappedReviews);

        } catch (error) {
            console.error("Error fetching reviews:", error);
            toast.error("Sharhlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const filterReviews = () => {
        let filtered = [...reviews];

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(review =>
                review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                review.product?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                review.user?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by rating
        if (ratingFilter !== 'all') {
            const rating = parseInt(ratingFilter);
            filtered = filtered.filter(review => review.rating === rating);
        }

        setFilteredReviews(filtered);
    };

    const handleReply = (review: Review) => {
        setSelectedReview(review);
        setReplyDialogOpen(true);
    };

    const submitReply = async () => {
        if (!selectedReview || !replyText.trim()) return;

        try {
            const { error } = await supabase
                .from('product_comments')
                .insert({
                    product_id: selectedReview.product_id,
                    user_id: user!.id,
                    text: replyText.trim(),
                    parent_id: selectedReview.id,
                    rating: 0 // Seller's reply has no rating
                });

            if (error) throw error;

            toast.success("Javob yuborildi");
            setReplyDialogOpen(false);
            setReplyText("");
            fetchReviews(); // Refresh list to show reply if implemented in UI
        } catch (error) {
            console.error("Error submitting reply:", error);
            toast.error("Javob yuborishda xatolik");
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-muted-foreground font-semibold animate-pulse">Sharhlar yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Helmet>
                <title>Sharhlar va Reytinglar - House Mobile</title>
            </Helmet>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                        Sharhlar va Reytinglar
                    </h1>
                    <p className="text-muted-foreground mt-1">Mijozlar fikrlari va baholari</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-amber-500 shadow-lg">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <Award className="h-6 w-6 text-amber-500" />
                            </div>
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={cn(
                                            "h-4 w-4",
                                            i < Math.round(stats.averageRating) ? "fill-amber-500 text-amber-500" : "text-muted"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                        <h3 className="text-3xl font-black mb-1">{stats.averageRating.toFixed(1)}</h3>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            O'rtacha reyting
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500 shadow-lg">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <MessageSquare className="h-6 w-6 text-blue-500" />
                            </div>
                            {stats.totalReviews > 0 && (
                                <Badge variant="default" className="gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    Yangi
                                </Badge>
                            )}
                        </div>
                        <h3 className="text-3xl font-black mb-1">{stats.totalReviews}</h3>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Jami sharhlar
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold w-8">5★</span>
                                <Progress value={(stats.fiveStars / stats.totalReviews) * 100} className="h-2" />
                                <span className="text-xs font-bold w-8 text-right">{stats.fiveStars}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold w-8">4★</span>
                                <Progress value={(stats.fourStars / stats.totalReviews) * 100} className="h-2" />
                                <span className="text-xs font-bold w-8 text-right">{stats.fourStars}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold w-8">3★</span>
                                <Progress value={(stats.threeStars / stats.totalReviews) * 100} className="h-2" />
                                <span className="text-xs font-bold w-8 text-right">{stats.threeStars}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg">
                    <CardContent className="pt-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold w-8">2★</span>
                                <Progress value={(stats.twoStars / stats.totalReviews) * 100} className="h-2" />
                                <span className="text-xs font-bold w-8 text-right">{stats.twoStars}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold w-8">1★</span>
                                <Progress value={(stats.oneStar / stats.totalReviews) * 100} className="h-2" />
                                <span className="text-xs font-bold w-8 text-right">{stats.oneStar}</span>
                            </div>
                            <div className="pt-2 text-center">
                                <p className="text-xs text-muted-foreground">
                                    {((stats.fiveStars + stats.fourStars) / stats.totalReviews * 100).toFixed(0)}% ijobiy
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="shadow-lg">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Sharh, mahsulot yoki mijoz nomi bo'yicha qidirish..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 rounded-lg"
                                />
                            </div>
                        </div>
                        <Select value={ratingFilter} onValueChange={setRatingFilter}>
                            <SelectTrigger className="w-full md:w-[200px] rounded-lg">
                                <SelectValue placeholder="Reyting bo'yicha" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Barcha reytinglar</SelectItem>
                                <SelectItem value="5">5 yulduz</SelectItem>
                                <SelectItem value="4">4 yulduz</SelectItem>
                                <SelectItem value="3">3 yulduz</SelectItem>
                                <SelectItem value="2">2 yulduz</SelectItem>
                                <SelectItem value="1">1 yulduz</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Reviews List */}
            <div className="space-y-4">
                {filteredReviews.length > 0 ? (
                    filteredReviews.map((review, index) => (
                        <Card
                            key={review.id}
                            className="shadow-md hover:shadow-lg transition-all animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <CardContent className="pt-6">
                                <div className="flex flex-col md:flex-row gap-4">
                                    {/* Product Image */}
                                    <div className="flex-shrink-0">
                                        {review.product?.media?.[0]?.url ? (
                                            <img
                                                src={review.product.media[0].url}
                                                alt={review.product.title}
                                                className="h-20 w-20 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                                                <Star className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Review Content */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <p className="font-semibold text-sm text-primary">
                                                    {review.product?.title}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    {review.user?.avatar_url ? (
                                                        <img
                                                            src={review.user.avatar_url}
                                                            alt=""
                                                            className="h-6 w-6 rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                                            {review.user?.full_name?.charAt(0) || 'U'}
                                                        </div>
                                                    )}
                                                    <span className="text-sm font-medium">{review.user?.full_name}</span>
                                                    <span className="text-xs text-muted-foreground">•</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(review.created_at).toLocaleDateString('uz-UZ')}
                                                    </span>
                                                </div>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="rounded-lg">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Amallar</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleReply(review)}>
                                                        <MessageSquare className="mr-2 h-4 w-4" />
                                                        Javob berish
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Flag className="mr-2 h-4 w-4" />
                                                        Shikoyat qilish
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={cn(
                                                        "h-4 w-4",
                                                        i < review.rating ? "fill-amber-500 text-amber-500" : "text-muted"
                                                    )}
                                                />
                                            ))}
                                        </div>

                                        <p className="text-sm text-foreground">{review.comment}</p>

                                        <div className="flex items-center gap-2 pt-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="rounded-lg"
                                                onClick={() => handleReply(review)}
                                            >
                                                <MessageSquare className="mr-2 h-3 w-3" />
                                                Javob berish
                                            </Button>
                                            <Button size="sm" variant="ghost" className="rounded-lg">
                                                <ThumbsUp className="mr-2 h-3 w-3" />
                                                Foydali
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="shadow-lg">
                        <CardContent className="py-16">
                            <div className="text-center">
                                <Star className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                                <h3 className="text-lg font-bold mb-2">Sharhlar topilmadi</h3>
                                <p className="text-sm text-muted-foreground">
                                    {searchQuery || ratingFilter !== 'all'
                                        ? "Qidiruv kriteriyalariga mos sharhlar yo'q"
                                        : "Hozircha hech qanday sharh yo'q"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Reply Dialog */}
            <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sharhga javob berish</DialogTitle>
                        <DialogDescription>
                            Mijozning fikriga javob yozing
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {selectedReview && (
                            <div className="p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-1 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn(
                                                "h-3 w-3",
                                                i < selectedReview.rating ? "fill-amber-500 text-amber-500" : "text-muted"
                                            )}
                                        />
                                    ))}
                                </div>
                                <p className="text-sm">{selectedReview.comment}</p>
                            </div>
                        )}

                        <Textarea
                            placeholder="Javobingizni yozing..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
                            Bekor qilish
                        </Button>
                        <Button onClick={submitReply} disabled={!replyText.trim()}>
                            Javob yuborish
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
