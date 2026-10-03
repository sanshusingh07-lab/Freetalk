import React, { useState, useEffect } from 'react';
import { featureService } from '../services/api.js';
import { BlindDebateCard } from '../components/debate/BlindDebateCard.jsx';
import { IdeaVsIdeaWidget } from '../components/debate/IdeaVsIdeaWidget.jsx';
import { CreateDebateModal } from '../components/debate/CreateDebateModal.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Scale, Split, PlusCircle } from 'lucide-react';

export function DebatesPage() {
  const [debates, setDebates] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [activeTab, setActiveTab] = useState('debates'); // 'debates' or 'ideas'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [debatesRes, ideasRes] = await Promise.all([
        featureService.getDebates(),
        featureService.getIdeas()
      ]);
      if (debatesRes.data.success) setDebates(debatesRes.data.debates);
      if (ideasRes.data.success) setIdeas(ideasRes.data.ideas);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleDebateCreated = (newDebate) => {
    setDebates((prev) => [newDebate, ...prev]);
    setActiveTab('debates');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-8 rounded-xl border border-paper-200 dark:border-ink-800 bg-white dark:bg-ink-850 shadow-subtle">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-terracotta-600 dark:text-terracotta-400">
            <Scale className="w-4 h-4" />
            <span>Blind Debates & Perspectives</span>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Launch Blind Debate
          </Button>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 dark:text-paper-100 tracking-tight">
          Judge the Argument, Not the Person
        </h1>
        <p className="text-xs sm:text-sm text-ink-600 dark:text-paper-300 max-w-xl mt-1 leading-relaxed font-sans">
          Opposing viewpoints presented under randomized blind identities (🅰️ Anonymous Raven vs 🅱️ Anonymous Fox). Vote purely on rhetorical logic and empirical facts.
        </p>

        <div className="flex items-center gap-2 pt-4 mt-4 border-t border-paper-100 dark:border-ink-800">
          <button
            onClick={() => setActiveTab('debates')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-all ${
              activeTab === 'debates'
                ? 'bg-terracotta-50 text-terracotta-700 border border-terracotta-200 dark:bg-terracotta-950/40 dark:text-terracotta-300 dark:border-terracotta-800/60 font-semibold shadow-subtle'
                : 'text-ink-600 dark:text-paper-300 hover:text-ink-900 dark:hover:text-paper-100 hover:bg-paper-100 dark:hover:bg-ink-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-terracotta-600 dark:text-terracotta-400" />
            <span>Blind Debates ({debates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ideas')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-all ${
              activeTab === 'ideas'
                ? 'bg-olive-50 text-olive-800 border border-olive-200 dark:bg-olive-950/40 dark:text-olive-300 dark:border-olive-800/60 font-semibold shadow-subtle'
                : 'text-ink-600 dark:text-paper-300 hover:text-ink-900 dark:hover:text-paper-100 hover:bg-paper-100 dark:hover:bg-ink-800'
            }`}
          >
            <Split className="w-3.5 h-3.5 text-olive-600 dark:text-olive-400" />
            <span>Idea vs. Idea ({ideas.length})</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs font-mono text-ink-600 dark:text-ink-400">Loading debate arenas...</div>
      ) : activeTab === 'debates' ? (
        <div className="space-y-6">
          {debates.map((debate) => (
            <BlindDebateCard key={debate.id} debate={debate} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {ideas.map((idea) => (
            <IdeaVsIdeaWidget key={idea.id} idea={idea} />
          ))}
        </div>
      )}

      {/* Create Debate Modal */}
      <CreateDebateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleDebateCreated}
      />
    </div>
  );
}
