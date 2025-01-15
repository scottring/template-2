import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useGoalStore } from '@/lib/stores/useGoalStore';
import { useTaskStore } from '@/lib/stores/useTaskStore';

const stages = [
  {
    id: 'onboarding',
    name: 'Base Goal Setting',
    description: 'Set vision and invite members',
    color: 'bg-blue-500',
    textColor: 'text-blue-500',
    icon: '🎯'
  },
  {
    id: 'planning',
    name: 'Review & Planning',
    description: 'Plan and distribute tasks',
    color: 'bg-purple-500',
    textColor: 'text-purple-500',
    icon: '📋'
  },
  {
    id: 'daily',
    name: 'Daily Life',
    description: 'Complete tasks together',
    color: 'bg-green-500',
    textColor: 'text-green-500',
    icon: '🏡'
  },
  {
    id: 'tracking',
    name: 'Progress Tracking',
    description: 'Monitor and celebrate',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-500',
    icon: '📈'
  },
  {
    id: 'reflection',
    name: 'Reflection & Adjustment',
    description: 'Learn and improve',
    color: 'bg-red-500',
    textColor: 'text-red-500',
    icon: '💭'
  }
];

export function CycleVisualizer() {
  const router = useRouter();
  const { goals } = useGoalStore();
  const { tasks } = useTaskStore();
  
  // Determine current stage based on user's activity
  const getCurrentStage = () => {
    if (goals.length === 0) return 'onboarding';
    if (tasks.some(t => t.status === 'completed')) return 'tracking';
    if (tasks.length > 0) return 'daily';
    if (goals.some(g => g.successCriteria.length > 0)) return 'planning';
    return 'reflection';
  };

  const currentStage = getCurrentStage();

  return (
    <div className="w-full max-w-4xl mx-auto p-8 border-4 border-red-500 bg-white rounded-xl shadow-2xl">
      <div className="relative">
        {/* Entry Branch */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute -left-20 top-1/2 w-20 h-2 bg-blue-500"
        />
        
        {/* Circular Path */}
        <div className="relative w-[600px] h-[600px] mx-auto border border-gray-200 rounded-full">
          {stages.map((stage, index) => {
            const angle = (index * 360) / stages.length;
            const isActive = stage.id === currentStage;
            
            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: isActive ? 1.1 : 1,
                  transition: { delay: index * 0.1 }
                }}
                className="absolute"
                style={{
                  transform: `rotate(${angle}deg) translate(250px) rotate(-${angle}deg)`,
                  transformOrigin: 'center'
                }}
              >
                <button
                  onClick={() => router.push(`/dashboard/${stage.id}`)}
                  className={`
                    relative group flex flex-col items-center justify-center
                    w-32 h-32 rounded-full ${stage.color} shadow-lg
                    ${isActive ? 'ring-4 ring-offset-4 ring-offset-white ring-blue-600' : ''}
                    transition-all duration-200 hover:scale-110
                  `}
                >
                  <span className="text-4xl mb-2">{stage.icon}</span>
                  <span className="text-white font-medium text-sm">
                    {stage.name}
                  </span>
                  
                  {/* Tooltip */}
                  <div className="
                    absolute top-full mt-2 w-48 p-2 bg-white rounded-lg shadow-lg
                    opacity-0 group-hover:opacity-100 transition-opacity duration-200
                    text-center pointer-events-none z-50
                  ">
                    <p className={`text-sm font-medium ${stage.textColor}`}>
                      {stage.description}
                    </p>
                  </div>
                </button>
              </motion.div>
            );
          })}
          
          {/* Center Content */}
          <div className="
            absolute inset-0 flex items-center justify-center
            text-center text-gray-600 bg-white/50 backdrop-blur-sm rounded-full
          ">
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Household Harmony
              </h3>
              <p className="text-sm">
                Working together towards shared goals
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 