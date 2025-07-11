import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, TrendingDown, Users, Smartphone } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: CheckCircle,
      title: "Smart Compatibility",
      titleBn: "স্মার্ট সামঞ্জস্য",
      description: "Automatic component compatibility checking with detailed warnings and suggestions.",
      benefits: ["Socket matching", "Power requirements", "Size compatibility"],
    },
    {
      icon: TrendingDown,
      title: "Best Prices",
      titleBn: "সেরা দাম",
      description: "Real-time price comparison across 25+ Bangladeshi retailers with price alerts.",
      benefits: ["Live price updates", "Historical tracking", "Stock notifications"],
    },
    {
      icon: Users,
      title: "Community Driven",
      titleBn: "কমিউনিটি চালিত",
      description: "Get help from experienced builders and share your builds with the community.",
      benefits: ["Expert reviews", "Build showcase", "Q&A support"],
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      titleBn: "মোবাইল অপ্টিমাইজড",
      description: "Fully responsive design optimized for mobile users in Bangladesh.",
      benefits: ["Touch friendly", "Offline builds", "Push notifications"],
    },
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose PC Banai?</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            The most comprehensive PC building platform designed specifically for Bangladesh
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                <p className="text-sm text-blue-600 font-medium">{feature.titleBn}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">{feature.description}</p>
                <div className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
