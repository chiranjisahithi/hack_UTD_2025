import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink } from "lucide-react";

interface CompanyPost {
  url: string;
  name: string;
  reply_context: string;
  text: string;
  timestamp: string;
}

interface CompanyPostsProps {
  posts: CompanyPost[];
}

const formatTimeAgo = (isoTime: string) => {
  const date = new Date(isoTime);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

export const CompanyPosts = ({ posts }: CompanyPostsProps) => {
  if (!posts || posts.length === 0) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Company Posts
          </CardTitle>
          <p className="text-sm text-muted-foreground">No company posts available</p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Company Posts
        </CardTitle>
        <p className="text-sm text-muted-foreground">Official responses</p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-3">
            {posts.map((post, index) => (
              <a
                key={`${post.url}-${index}`}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg border border-border hover:border-primary/50 transition-colors bg-card/50 cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground text-sm">{post.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(post.timestamp)}
                    </span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
                <p className="text-sm text-foreground group-hover:text-primary/90 transition-colors leading-relaxed">
                  {post.text}
                </p>
              </a>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

