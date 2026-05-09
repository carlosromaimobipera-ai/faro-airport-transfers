import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, ExternalLink, MessageSquare } from 'lucide-react';

function StarDisplay({ rating, size = 'sm' }) {
  const cls = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          className={`${cls} ${s <= Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsStats() {
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => base44.entities.Review.list('-created_date', 500),
  });

  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" /> Avaliações dos Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma avaliação ainda.</p>
        </CardContent>
      </Card>
    );
  }

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100),
  }));
  const googleClicks = reviews.filter(r => r.google_redirect).length;
  const withComment = reviews.filter(r => r.comment?.trim()).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" /> Avaliações dos Clientes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Average */}
        <div className="flex items-center gap-5">
          <div className="text-center">
            <p className="text-5xl font-bold text-foreground leading-none">{avg.toFixed(1)}</p>
            <StarDisplay rating={avg} size="md" />
            <p className="text-xs text-muted-foreground mt-1">{reviews.length} avaliações</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {dist.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-3">{star}</span>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 shrink-0" />
                <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/40 rounded-lg p-3 text-center">
            <ExternalLink className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold">{googleClicks}</p>
            <p className="text-xs text-muted-foreground">Cliques Google</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-3 text-center">
            <MessageSquare className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold">{withComment}</p>
            <p className="text-xs text-muted-foreground">Com comentário</p>
          </div>
        </div>

        {/* Recent reviews */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recentes</p>
          {reviews.slice(0, 10).map(r => (
            <div key={r.id} className="bg-muted/30 rounded-lg p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{r.customer_name || 'Anónimo'}</span>
                <StarDisplay rating={r.rating} />
              </div>
              {r.route && <p className="text-xs text-muted-foreground">{r.route} · {r.transfer_date}</p>}
              {r.comment && <p className="text-sm text-foreground/80 italic">"{r.comment}"</p>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}