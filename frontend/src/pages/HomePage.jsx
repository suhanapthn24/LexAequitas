import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Scale,
  Gavel,
  FileText,
  Shield,
  Clock,
  Lightbulb,
  ArrowRight,
  Play,
} from "lucide-react";

const HomePage = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Gavel,
      title: "AI Trial Simulation",
      description:
        "Practice courtroom arguments against AI-powered opponents with realistic judicial feedback.",
    },
    {
      icon: Clock,
      title: "Deadline Monitoring",
      description:
        "Never miss a filing deadline with intelligent tracking and automated alerts.",
    },
    {
      icon: Shield,
      title: "Compliance Tracking",
      description:
        "Stay compliant with real-time procedural risk alerts and monitoring.",
    },
    {
      icon: FileText,
      title: "Document Management",
      description:
        "Organize, store, and retrieve legal documents with powerful search.",
    },
    {
      icon: Scale,
      title: "Case Workflow",
      description:
        "Streamline case management with intuitive dashboards and tracking.",
    },
    {
      icon: Lightbulb,
      title: "Strategy Suggestions",
      description:
        "AI-powered legal strategy recommendations based on case analysis.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1758833502047-8f1c7dc5edd7?auto=format&fit=crop&w=1920&q=80')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/95 via-[#0F172A]/85 to-[#0F172A]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <p className="text-[#D4AF37] uppercase tracking-[0.3em] text-xs font-bold mb-6">
            Legal Technology Redefined
          </p>

          <h1 className="font-serif text-5xl md:text-7xl font-bold text-white mb-6">
            Master the Courtroom
            <br />
            <span className="text-[#D4AF37]">Before You Enter</span>
          </h1>

          <p className="text-slate-300 text-lg md:text-xl mb-10">
            AI-powered trial simulations and intelligent legal tools.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={user ? "/simulation" : "/login"}>
              <Button className="bg-[#D4AF37] text-[#0F172A] px-8 py-6">
                <Play className="mr-2" />
                Start Simulation
              </Button>
            </Link>

            <Link to="/services">
              <Button variant="outline" className="px-8 py-6">
                Explore Services
                <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 bg-[#020617]">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl text-white text-center mb-12">
            Platform Capabilities
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="p-6 border border-slate-800">
                  <Icon className="text-[#D4AF37] mb-4" />
                  <h3 className="text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center bg-[#0F172A]">
        <h2 className="text-4xl text-white mb-6">
          Ready to Transform Your Practice?
        </h2>

        <Link to={user ? "/cases" : "/auth"}>
          <Button className="bg-[#D4AF37] text-[#0F172A] px-10 py-6">
            {user ? "Go to Dashboard" : "Get Started"}
            <ArrowRight className="ml-2" />
          </Button>
        </Link>
      </section>
    </div>
  );
};

export default HomePage;