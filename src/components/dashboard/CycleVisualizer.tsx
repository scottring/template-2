import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import useGoalStore from '@/lib/stores/useGoalStore';
import useTaskStore from '@/lib/stores/useTaskStore';

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
  
  const getCurrentStage = () => {
    if (goals.length === 0) return 'onboarding';
    if (tasks.some(t => t.status === 'completed')) return 'tracking';
    if (tasks.length > 0) return 'daily';
    if (goals.some(g => g.steps && g.steps.length > 0)) return 'planning';
    return 'reflection';
  };

  const currentStage = getCurrentStage();
  const currentIndex = stages.findIndex(stage => stage.id === currentStage);

  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-2xl">
      <div className="relative">
        <div className="relative mx-auto">
          {/* Progress line */}
          <div className="absolute top-12 left-0 w-full h-1 bg-gray-200">
            <div 
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ 
                width: `${((currentIndex + 1) / stages.length) * 100}%`
              }}
            />
          </div>

          {/* Stages */}
          <div className="flex justify-between items-start relative">
            {stages.map((stage, index) => {
              const isActive = stage.id === currentStage;
              const isPast = index <= currentIndex;
              
              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: index * 0.1 }
                  }}
                  className="flex flex-col items-center"
                  style={{ width: '120px' }}
                >
                  <button
                    onClick={() => router.push(`/dashboard/${stage.id}`)}
                    className={`
                      relative group flex flex-col items-center justify-center
                      w-24 h-24 rounded-full ${isPast ? stage.color : 'bg-gray-200'} shadow-lg
                      ${isActive ? 'ring-4 ring-offset-4 ring-offset-white ring-blue-600' : ''}
                      transition-all duration-200 hover:scale-110
                    `}
                  >
                    <span className="text-3xl mb-1">{stage.icon}</span>
                    <span className="text-white font-medium text-xs px-1 text-center">
                      {stage.name}
                    </span>
                    
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
                  
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: isActive ? 1 : 0,
                      transition: { delay: 0.2 }
                    }}
                    className="mt-4 text-sm font-medium text-blue-600"
                  >
                    {isActive && 'Current Stage'}
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
} 