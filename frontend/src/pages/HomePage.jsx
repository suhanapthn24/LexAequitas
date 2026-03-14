import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scale, Gavel, FileText, Shield, Clock, Lightbulb, ArrowRight, Play } from "lucide-react";

const HomePage = () => {
  const features = [
    {
      icon: Gavel,
      title: "AI Trial Simulation",
      description: "Practice courtroom arguments against AI-powered opponents with realistic judicial feedback.",
    },
    {
      icon: Clock,
      title: "Deadline Monitoring",
      description: "Never miss a filing deadline with intelligent tracking and automated alerts.",
    },
    {
      icon: Shield,
      title: "Compliance Tracking",
      description: "Stay compliant with real-time procedural risk alerts and monitoring.",
    },
    {
      icon: FileText,
      title: "Document Management",
      description: "Organize, store, and retrieve legal documents with powerful search.",
    },
    {
      icon: Scale,
      title: "Case Workflow",
      description: "Streamline case management with intuitive dashboards and tracking.",
    },
    {
      icon: Lightbulb,
      title: "Strategy Suggestions",
      description: "AI-powered legal strategy recommendations based on case analysis.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1758833502047-8f1c7dc5edd7?auto=format&fit=crop&w=1920&q=80')"
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/95 via-[#0F172A]/85 to-[#0F172A]" />
        </div>
        
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] hero-glow" />
        
        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <p className="text-[#D4AF37] uppercase tracking-[0.3em] text-xs font-bold mb-6 animate-fade-in-up">
            Legal Technology Redefined
          </p>
          <h1 className="font-serif text-5xl md:text-7xl font-bold text-white leading-tight mb-6 animate-fade-in-up animate-delay-100">
            Master the Courtroom<br />
            <span className="text-[#D4AF37]">Before You Enter</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-fade-in-up animate-delay-200">
            AI-powered trial simulations, intelligent case management, and compliance monitoring for modern legal professionals.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animate-delay-300">
            <Link to="/simulation" data-testid="hero-simulation-btn">
              <Button className="bg-[#D4AF37] text-[#0F172A] hover:bg-[#c9a430] rounded-none uppercase tracking-wide text-sm font-bold px-8 py-6 hover-lift">
                <Play className="w-5 h-5 mr-2" />
                Start Simulation
              </Button>
            </Link>
            <Link to="/services" data-testid="hero-services-btn">
              <Button variant="outline" className="border-slate-400 text-white hover:bg-white/10 rounded-none uppercase tracking-wide text-sm font-bold px-8 py-6">
                Explore Services
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-[#D4AF37]/50 rounded-full flex justify-center">
            <div className="w-1 h-2 bg-[#D4AF37] rounded-full mt-2" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[#020617] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-bold mb-4">
              Platform Capabilities
            </p>
            <h2 className="font-serif text-3xl md:text-5xl font-bold text-white">
              Everything You Need to Win
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group p-8 border border-slate-800 hover:border-[#D4AF37]/30 transition-all duration-300 hover:-translate-y-1"
                  data-testid={`feature-card-${index}`}
                >
                  <div className="w-12 h-12 flex items-center justify-center border border-[#D4AF37]/30 mb-6 group-hover:border-[#D4AF37] transition-colors">
                    <Icon className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <h3 className="font-serif text-xl text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trial Simulation Highlight */}
      <section className="py-24 bg-[#0F172A] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-bold mb-4">
                Featured Module
              </p>
              <h2 className="font-serif text-3xl md:text-5xl font-bold text-white mb-6">
                AI Courtroom<br />Simulation
              </h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                Face off against AI-powered defense attorneys and judges in realistic trial scenarios. 
                Receive instant feedback on your arguments, learn from missed objections, and improve 
                your courtroom strategy.
              </p>
              <ul className="space-y-4 mb-8">
                {["Audio-based courtroom dialogue", "Realistic objections & rulings", "Post-trial performance coaching", "Multiple case type simulations"].map((item, i) => (
                  <li key={i} className="flex items-center text-slate-300">
                    <div className="w-2 h-2 bg-[#D4AF37] mr-4" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/simulation" data-testid="cta-simulation-btn">
                <Button className="bg-[#0F172A] text-white border-b-2 border-[#D4AF37] hover:bg-[#1E293B] rounded-none uppercase tracking-wide text-sm font-bold px-8 py-4">
                  Try Simulation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-sm overflow-hidden border border-[#D4AF37]/20">
                <img
                  src="https://images.unsplash.com/photo-1769029265788-d7921a103403?auto=format&fit=crop&w=800&q=80"
                  alt="Courtroom gavel"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] to-transparent" />
              </div>
              {/* Decorative element */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 border border-[#D4AF37]/30" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#020617] relative">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Practice?
          </h2>
          <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
            Join legal professionals who are using AI to prepare better, work smarter, and win more cases.
          </p>
          <Link to="/auth" data-testid="cta-signup-btn">
            <Button className="bg-[#D4AF37] text-[#0F172A] hover:bg-[#c9a430] rounded-none uppercase tracking-wide text-sm font-bold px-10 py-6 hover-lift">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
