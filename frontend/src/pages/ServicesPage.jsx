import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Gavel, 
  FileText, 
  Shield, 
  Clock, 
  Lightbulb, 
  Scale,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

const ServicesPage = () => {
  const services = [
    {
      icon: Gavel,
      title: "AI Trial Simulation",
      description: "Practice courtroom arguments in realistic AI-powered trial scenarios. Face off against intelligent defense attorneys and receive judicial feedback.",
      features: [
        "Audio-based courtroom dialogue",
        "AI Defense Attorney & Judge",
        "Multiple case types (civil, criminal, corporate)",
        "Real-time objections and rulings",
        "Post-trial performance analysis",
        "Argument improvement suggestions"
      ],
      link: "/simulation",
      highlight: true
    },
    {
      icon: Scale,
      title: "Case Workflow Management",
      description: "Streamline your case management with intuitive dashboards, status tracking, and comprehensive case organization.",
      features: [
        "Case status tracking",
        "Client information management",
        "Court and judge details",
        "Hearing date scheduling",
        "Case type categorization",
        "Progress monitoring"
      ],
      link: "/cases",
      highlight: false
    },
    {
      icon: Clock,
      title: "Deadline Monitoring",
      description: "Never miss a critical deadline with intelligent tracking, automated alerts, and calendar integration.",
      features: [
        "Filing deadline alerts",
        "Hearing date reminders",
        "Response deadline tracking",
        "Priority-based notifications",
        "Calendar synchronization",
        "Team deadline sharing"
      ],
      link: "/alerts",
      highlight: false
    },
    {
      icon: FileText,
      title: "Legal Document Management",
      description: "Organize, store, and retrieve legal documents efficiently with powerful categorization and search capabilities.",
      features: [
        "Document upload & storage",
        "Category organization",
        "Case-linked documents",
        "Secure file handling",
        "Quick document retrieval",
        "Multiple format support"
      ],
      link: "/documents",
      highlight: false
    },
    {
      icon: Shield,
      title: "Compliance & Risk Alerts",
      description: "Stay compliant with real-time procedural risk alerts, compliance monitoring, and proactive risk management.",
      features: [
        "Procedural compliance checks",
        "Risk severity ratings",
        "Regulatory monitoring",
        "Compliance dashboards",
        "Alert prioritization",
        "Resolution tracking"
      ],
      link: "/alerts",
      highlight: false
    },
    {
      icon: Lightbulb,
      title: "Legal Strategy Suggestions",
      description: "Receive AI-powered legal strategy recommendations based on case analysis and historical precedents.",
      features: [
        "Argument analysis",
        "Precedent suggestions",
        "Strategy recommendations",
        "Weakness identification",
        "Improvement coaching",
        "Performance metrics"
      ],
      link: "/simulation",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Hero Section */}
      <section className="py-24 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] hero-glow" />
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <p className="text-[#D4AF37] uppercase tracking-[0.3em] text-xs font-bold mb-6">
            Our Services
          </p>
          <h1 className="font-serif text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            Comprehensive Legal<br />
            <span className="text-[#D4AF37]">Technology Solutions</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            From AI-powered trial simulations to intelligent case management, 
            we provide everything modern legal professionals need to excel.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={index}
                  className={`group border ${
                    service.highlight 
                      ? "border-[#D4AF37]/30 bg-gradient-to-r from-[#D4AF37]/5 to-transparent" 
                      : "border-slate-800 hover:border-[#D4AF37]/20"
                  } transition-all duration-300`}
                  data-testid={`service-card-${index}`}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
                    {/* Service Info */}
                    <div className="lg:col-span-2">
                      <div className="flex items-start gap-4 mb-6">
                        <div className={`w-14 h-14 flex items-center justify-center border ${
                          service.highlight ? "border-[#D4AF37] bg-[#D4AF37]/10" : "border-slate-700"
                        }`}>
                          <Icon className="w-7 h-7 text-[#D4AF37]" />
                        </div>
                        <div>
                          <h3 className="font-serif text-2xl text-white mb-2">{service.title}</h3>
                          {service.highlight && (
                            <span className="text-xs uppercase tracking-wide text-[#D4AF37] font-bold">
                              Featured Service
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-300 text-lg leading-relaxed mb-6">
                        {service.description}
                      </p>
                      <Link to={service.link}>
                        <Button className={`${
                          service.highlight 
                            ? "bg-[#D4AF37] text-[#0F172A] hover:bg-[#c9a430]" 
                            : "bg-[#0F172A] text-white border-b-2 border-[#D4AF37] hover:bg-[#1E293B]"
                        } rounded-none uppercase tracking-wide text-xs font-bold px-6 py-3`}>
                          Get Started
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </div>

                    {/* Features List */}
                    <div className="border-t lg:border-t-0 lg:border-l border-slate-800 pt-6 lg:pt-0 lg:pl-8">
                      <h4 className="text-sm uppercase tracking-wide text-slate-400 mb-4">
                        Key Features
                      </h4>
                      <ul className="space-y-3">
                        {service.features.map((feature, i) => (
                          <li key={i} className="flex items-center text-slate-300">
                            <CheckCircle2 className="w-4 h-4 text-[#10B981] mr-3 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#0F172A]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-6">
            Start Using LexAequitas Today
          </h2>
          <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of legal professionals who are transforming their practice with AI-powered tools.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth" data-testid="services-signup-btn">
              <Button className="bg-[#D4AF37] text-[#0F172A] hover:bg-[#c9a430] rounded-none uppercase tracking-wide text-sm font-bold px-8 py-4 hover-lift">
                Create Free Account
              </Button>
            </Link>
            <Link to="/simulation" data-testid="services-demo-btn">
              <Button variant="outline" className="border-slate-400 text-white hover:bg-white/10 rounded-none uppercase tracking-wide text-sm font-bold px-8 py-4">
                Try Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
