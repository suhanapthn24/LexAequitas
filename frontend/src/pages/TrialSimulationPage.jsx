import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import axios from "axios";
import { 
  Gavel, 
  Play, 
  Send, 
  Volume2, 
  VolumeX, 
  Square,
  Scale,
  User,
  Shield,
  MessageSquare,
  AlertTriangle,
  Loader2,
  Mic,
  Trophy,
  Target,
  TrendingUp
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TrialSimulationPage = () => {
  const { getAuthHeader } = useAuth();
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentArgument, setCurrentArgument] = useState("");
  const [argumentType, setArgumentType] = useState("statement");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [playingAudio, setPlayingAudio] = useState(null);
  const audioRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Start form state
  const [caseType, setCaseType] = useState("civil");
  const [caseTitle, setCaseTitle] = useState("");
  const [caseDescription, setCaseDescription] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startSimulation = async () => {
    if (!caseTitle.trim() || !caseDescription.trim()) {
      toast.error("Please fill in case details");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API}/simulation/start`,
        {
          case_type: caseType,
          case_title: caseTitle,
          case_description: caseDescription,
          user_role: "plaintiff_attorney"
        },
        getAuthHeader()
      );
      setSession(response.data);
      setMessages([]);
      setFeedback(null);
      toast.success("Simulation started. Present your opening argument.");
    } catch (error) {
      toast.error("Failed to start simulation");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitArgument = async () => {
    if (!currentArgument.trim() || !session) return;

    setIsLoading(true);
    const userMessage = {
      id: Date.now().toString(),
      speaker: "lawyer",
      content: currentArgument,
      argument_type: argumentType,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentArgument("");

    try {
      const response = await axios.post(
        `${API}/simulation/argument`,
        {
          session_id: session.session_id,
          argument_text: currentArgument,
          argument_type: argumentType
        },
        getAuthHeader()
      );

      // Skip first response (user's message echo) and add AI responses
      const aiResponses = response.data.slice(1);
      setMessages(prev => [...prev, ...aiResponses]);

      // Auto-play audio if enabled
      if (audioEnabled && aiResponses.length > 0) {
        for (const msg of aiResponses) {
          if (msg.audio_base64) {
            await playAudio(msg.audio_base64, msg.id);
          }
        }
      }
    } catch (error) {
      toast.error("Failed to submit argument");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (base64Audio, messageId) => {
    return new Promise((resolve) => {
      if (!base64Audio) {
        resolve();
        return;
      }
      
      setPlayingAudio(messageId);
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audioRef.current = audio;
      
      audio.onended = () => {
        setPlayingAudio(null);
        resolve();
      };
      
      audio.onerror = () => {
        setPlayingAudio(null);
        resolve();
      };
      
      audio.play().catch(() => {
        setPlayingAudio(null);
        resolve();
      });
    });
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingAudio(null);
  };

  const endSimulation = async () => {
    if (!session) return;

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API}/simulation/${session.session_id}/end`,
        {},
        getAuthHeader()
      );
      setFeedback(response.data);
      setSession(null);
      toast.success("Simulation ended. Review your feedback.");
    } catch (error) {
      toast.error("Failed to end simulation");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSpeakerStyles = (speaker) => {
    switch (speaker) {
      case "lawyer":
        return {
          bg: "bg-blue-900/30 border-blue-500/30",
          badge: "speaker-lawyer",
          icon: User,
          name: "You (Counsel)"
        };
      case "defense":
        return {
          bg: "bg-red-900/30 border-red-500/30",
          badge: "speaker-defense",
          icon: Shield,
          name: "Defense Attorney"
        };
      case "judge":
        return {
          bg: "bg-amber-900/30 border-[#D4AF37]/30",
          badge: "speaker-judge",
          icon: Gavel,
          name: "The Honorable Judge"
        };
      default:
        return {
          bg: "bg-slate-800/50",
          badge: "",
          icon: MessageSquare,
          name: "Unknown"
        };
    }
  };

  // Setup Form
  if (!session && !feedback) {
    return (
      <div className="min-h-screen bg-[#0F172A] py-24">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="w-20 h-20 mx-auto mb-6 border border-[#D4AF37]/30 flex items-center justify-center">
              <Gavel className="w-10 h-10 text-[#D4AF37]" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
              AI Trial Simulation
            </h1>
            <p className="text-slate-300 max-w-xl mx-auto">
              Practice your courtroom arguments against AI-powered defense attorneys and judges.
              Receive real-time feedback and improve your litigation skills.
            </p>
          </div>

          <Card className="bg-[#020617] border-slate-800 p-8">
            <h2 className="font-serif text-xl text-white mb-6">Configure Your Trial</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-slate-400 uppercase tracking-wide mb-2">
                  Case Type
                </label>
                <Select value={caseType} onValueChange={setCaseType}>
                  <SelectTrigger 
                    className="bg-transparent border-slate-700 text-white focus:border-[#D4AF37]"
                    data-testid="case-type-select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F172A] border-slate-700">
                    <SelectItem value="civil">Civil Litigation</SelectItem>
                    <SelectItem value="criminal">Criminal Defense</SelectItem>
                    <SelectItem value="corporate">Corporate Law</SelectItem>
                    <SelectItem value="family">Family Law</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 uppercase tracking-wide mb-2">
                  Case Title
                </label>
                <Input
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  placeholder="e.g., Smith v. Johnson Industries"
                  className="bg-transparent border-slate-700 text-white placeholder:text-slate-500 focus:border-[#D4AF37]"
                  data-testid="case-title-input"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 uppercase tracking-wide mb-2">
                  Case Description
                </label>
                <Textarea
                  value={caseDescription}
                  onChange={(e) => setCaseDescription(e.target.value)}
                  placeholder="Describe the case facts, your client's position, and key arguments..."
                  rows={4}
                  className="bg-transparent border-slate-700 text-white placeholder:text-slate-500 focus:border-[#D4AF37] resize-none"
                  data-testid="case-description-input"
                />
              </div>

              <Button
                onClick={startSimulation}
                disabled={isLoading}
                className="w-full bg-[#D4AF37] text-[#0F172A] hover:bg-[#c9a430] rounded-none uppercase tracking-wide font-bold py-4"
                data-testid="start-simulation-btn"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Play className="w-5 h-5 mr-2" />
                )}
                Begin Trial Simulation
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Feedback View
  if (feedback) {
    return (
      <div className="min-h-screen bg-[#0F172A] py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <Trophy className="w-16 h-16 text-[#D4AF37] mx-auto mb-4" />
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-2">
              Trial Complete
            </h1>
            <p className="text-slate-300">Review your performance analysis</p>
          </div>

          {/* Score Card */}
          <Card className="bg-[#020617] border-slate-800 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-white">Overall Performance</h2>
              <Badge className="bg-[#D4AF37] text-[#0F172A] text-2xl px-4 py-1 font-bold">
                {feedback.overall_score}/100
              </Badge>
            </div>
            <Progress 
              value={feedback.overall_score} 
              className="h-3 bg-slate-800"
            />
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Strengths */}
            <Card className="bg-[#020617] border-slate-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-[#10B981]" />
                <h3 className="font-serif text-lg text-white">Strengths</h3>
              </div>
              <ul className="space-y-2">
                {feedback.strengths.map((item, i) => (
                  <li key={i} className="text-slate-300 flex items-start">
                    <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full mt-2 mr-3 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Weaknesses */}
            <Card className="bg-[#020617] border-slate-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-[#EF4444]" />
                <h3 className="font-serif text-lg text-white">Areas to Improve</h3>
              </div>
              <ul className="space-y-2">
                {feedback.weaknesses.map((item, i) => (
                  <li key={i} className="text-slate-300 flex items-start">
                    <span className="w-1.5 h-1.5 bg-[#EF4444] rounded-full mt-2 mr-3 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Missed Objections & Precedents */}
          {(feedback.missed_objections.length > 0 || feedback.suggested_precedents.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {feedback.missed_objections.length > 0 && (
                <Card className="bg-[#020617] border-slate-800 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    <h3 className="font-serif text-lg text-white">Missed Objections</h3>
                  </div>
                  <ul className="space-y-2">
                    {feedback.missed_objections.map((item, i) => (
                      <li key={i} className="text-slate-300 text-sm">{item}</li>
                    ))}
                  </ul>
                </Card>
              )}

              {feedback.suggested_precedents.length > 0 && (
                <Card className="bg-[#020617] border-slate-800 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Scale className="w-5 h-5 text-[#D4AF37]" />
                    <h3 className="font-serif text-lg text-white">Suggested Precedents</h3>
                  </div>
                  <ul className="space-y-2">
                    {feedback.suggested_precedents.map((item, i) => (
                      <li key={i} className="text-slate-300 text-sm">{item}</li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          )}

          {/* Improvement Tips */}
          <Card className="bg-[#020617] border-[#D4AF37]/20 p-6 mb-8">
            <h3 className="font-serif text-lg text-white mb-4">Coaching Tips</h3>
            <ul className="space-y-3">
              {feedback.improvement_tips.map((tip, i) => (
                <li key={i} className="flex items-start text-slate-300">
                  <span className="w-6 h-6 bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] text-xs mr-3 flex-shrink-0">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </Card>

          <div className="text-center">
            <Button
              onClick={() => setFeedback(null)}
              className="bg-[#D4AF37] text-[#0F172A] hover:bg-[#c9a430] rounded-none uppercase tracking-wide font-bold px-8 py-4"
              data-testid="new-simulation-btn"
            >
              Start New Simulation
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Active Simulation - Courtroom View
  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Header */}
      <div className="bg-[#0F172A] border-b border-[#D4AF37]/20 py-4 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[#D4AF37] text-xs uppercase tracking-wide">Active Trial</p>
            <h1 className="font-serif text-xl text-white">{session?.case_title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="text-slate-300 hover:text-white"
              data-testid="toggle-audio-btn"
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <Button
              onClick={endSimulation}
              disabled={isLoading}
              variant="outline"
              className="border-[#EF4444]/50 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-none uppercase text-xs"
              data-testid="end-simulation-btn"
            >
              <Square className="w-4 h-4 mr-2" />
              End Trial
            </Button>
          </div>
        </div>
      </div>

      {/* Three-Pane Courtroom Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-4 p-4 h-[calc(100vh-180px)]">
        {/* Left Panel - User Arguments */}
        <div className="col-span-3 courtroom-panel rounded-sm p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm uppercase tracking-wide text-slate-400">Your Arguments</h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-3 pr-2">
              {messages.filter(m => m.speaker === "lawyer").map((msg) => (
                <div key={msg.id} className="p-3 bg-blue-900/20 border border-blue-500/20 rounded-sm">
                  <Badge className="text-xs mb-2 bg-blue-500/20 text-blue-300">
                    {msg.argument_type}
                  </Badge>
                  <p className="text-slate-300 text-sm">{msg.content}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center Panel - Main Transcript */}
        <div className="col-span-6 courtroom-panel rounded-sm p-4 flex flex-col">
          <div className="flex items-center justify-center gap-2 mb-4 pb-4 border-b border-slate-800">
            <Gavel className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-sm uppercase tracking-wide text-slate-400">Court Proceedings</h3>
          </div>
          
          <ScrollArea className="flex-1 mb-4">
            <div className="space-y-4 pr-2">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  <Mic className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>Present your opening argument to begin</p>
                </div>
              )}
              {messages.map((msg) => {
                const styles = getSpeakerStyles(msg.speaker);
                const Icon = styles.icon;
                return (
                  <div 
                    key={msg.id} 
                    className={`p-4 ${styles.bg} border rounded-sm transition-all ${
                      playingAudio === msg.id ? "ring-2 ring-[#D4AF37]/50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${styles.badge}`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white font-medium text-sm">{styles.name}</span>
                      </div>
                      {msg.audio_base64 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => playingAudio === msg.id ? stopAudio() : playAudio(msg.audio_base64, msg.id)}
                          className="text-[#D4AF37] hover:text-white h-8 w-8 p-0"
                        >
                          {playingAudio === msg.id ? (
                            <Square className="w-4 h-4" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    <p className="text-slate-200 leading-relaxed">{msg.content}</p>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-slate-800 pt-4">
            <div className="flex gap-2 mb-3">
              <Select value={argumentType} onValueChange={setArgumentType}>
                <SelectTrigger 
                  className="w-40 bg-transparent border-slate-700 text-slate-300 text-xs"
                  data-testid="argument-type-select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0F172A] border-slate-700">
                  <SelectItem value="statement">Statement</SelectItem>
                  <SelectItem value="objection">Objection</SelectItem>
                  <SelectItem value="evidence">Evidence</SelectItem>
                  <SelectItem value="cross_examination">Cross-Examine</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Textarea
                value={currentArgument}
                onChange={(e) => setCurrentArgument(e.target.value)}
                placeholder="Present your argument..."
                className="flex-1 bg-transparent border-slate-700 text-white placeholder:text-slate-500 focus:border-[#D4AF37] resize-none"
                rows={2}
                data-testid="argument-input"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitArgument();
                  }
                }}
              />
              <Button
                onClick={submitArgument}
                disabled={isLoading || !currentArgument.trim()}
                className="bg-[#D4AF37] text-[#0F172A] hover:bg-[#c9a430] rounded-none px-6"
                data-testid="submit-argument-btn"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel - Opposition & Judge */}
        <div className="col-span-3 courtroom-panel rounded-sm p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-red-400" />
            <h3 className="text-sm uppercase tracking-wide text-slate-400">Opposition</h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-3 pr-2">
              {messages.filter(m => m.speaker === "defense" || m.speaker === "judge").map((msg) => {
                const isJudge = msg.speaker === "judge";
                return (
                  <div 
                    key={msg.id} 
                    className={`p-3 rounded-sm ${
                      isJudge 
                        ? "bg-amber-900/20 border border-[#D4AF37]/20" 
                        : "bg-red-900/20 border border-red-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {isJudge ? (
                        <Gavel className="w-4 h-4 text-[#D4AF37]" />
                      ) : (
                        <Shield className="w-4 h-4 text-red-400" />
                      )}
                      <span className={`text-xs font-medium ${isJudge ? "text-[#D4AF37]" : "text-red-400"}`}>
                        {isJudge ? "Judge" : "Defense"}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm">{msg.content}</p>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default TrialSimulationPage;
