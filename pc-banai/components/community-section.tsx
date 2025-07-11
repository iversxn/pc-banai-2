import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageCircle, ThumbsUp, Users, Trophy } from "lucide-react"

export function CommunitySection() {
  const communityStats = [
    { icon: Users, label: "Active Members", value: "15,000+" },
    { icon: MessageCircle, label: "Discussions", value: "2,500+" },
    { icon: ThumbsUp, label: "Helpful Reviews", value: "8,000+" },
    { icon: Trophy, label: "Featured Builds", value: "500+" },
  ]

  const recentPosts = [
    {
      title: "Best budget gaming build under ৳60,000?",
      titleBn: "৬০,০০০ টাকার নিচে সেরা বাজেট গেমিং বিল্ড?",
      author: "TechGuru_BD",
      replies: 23,
      likes: 45,
      category: "Build Help",
    },
    {
      title: "RTX 4060 vs RTX 3070 - Which to buy in 2024?",
      titleBn: "RTX 4060 বনাম RTX 3070 - ২০২৪ সালে কোনটি কিনবেন?",
      author: "GamerBoy_Dhaka",
      replies: 18,
      likes: 32,
      category: "GPU Discussion",
    },
    {
      title: "My first PC build - Gaming + Content Creation",
      titleBn: "আমার প্রথম পিসি বিল্ড - গেমিং + কন্টেন্ট ক্রিয়েশন",
      author: "CreativeMinds",
      replies: 12,
      likes: 67,
      category: "Build Showcase",
    },
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Our Community</h2>
          <p className="text-lg text-gray-600 mb-8">
            Connect with fellow PC builders, share your builds, and get expert advice
          </p>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {communityStats.map((stat, index) => (
            <Card key={index} className="text-center bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Community Posts */}
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Discussions</h3>
            <div className="space-y-4">
              {recentPosts.map((post, index) => (
                <Card key={index} className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="outline">{post.category}</Badge>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {post.replies}
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          {post.likes}
                        </div>
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{post.title}</h4>
                    <p className="text-sm text-blue-600 mb-3">{post.titleBn}</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{post.author[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600">by {post.author}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Get Started</h3>
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Join the Community</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Get help from experienced builders, share your builds, and stay updated with the latest PC hardware
                  trends in Bangladesh.
                </p>
                <div className="space-y-3">
                  <Button className="w-full">Create Account</Button>
                  <Button variant="outline" className="w-full bg-transparent">
                    Browse Community
                  </Button>
                </div>
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Popular Topics:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Gaming Builds</Badge>
                    <Badge variant="secondary">Budget PCs</Badge>
                    <Badge variant="secondary">GPU Reviews</Badge>
                    <Badge variant="secondary">Troubleshooting</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
