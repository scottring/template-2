'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, FolderIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/contexts/AuthContext';
import useAreaStore from '@/lib/stores/useAreaStore';
import useGoalStore from '@/lib/stores/useGoalStore';
import { Area, Goal } from '@/types/models';
import { CreateAreaDialog } from '@/components/areas/CreateAreaDialog';
import { EditAreaDialog } from '@/components/areas/EditAreaDialog';
import { cn } from '@/lib/utils';

export default function AreasPage() {
  const { user } = useAuth();
  const { areas, loading, error, fetchAreas, deleteArea } = useAreaStore();
  const goals = useGoalStore((state: { goals: Goal[] }) => state.goals);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.householdId) {
      fetchAreas(user.householdId);
    }
  }, [user?.householdId, fetchAreas]);

  const handleDelete = async (areaId: string) => {
    if (window.confirm('Are you sure you want to delete this area? This action cannot be undone.')) {
      try {
        await deleteArea(areaId);
      } catch (error) {
        console.error('Error deleting area:', error);
      }
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-br from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Areas
          </h1>
        </div>
        <Card className="backdrop-blur-sm bg-white/50">
          <CardContent className="p-6">
            Loading...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-br from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Areas
          </h1>
        </div>
        <Card className="backdrop-blur-sm bg-white/50">
          <CardContent className="p-6 text-red-500">
            Error loading areas: {error}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-br from-gray-800 to-gray-600 bg-clip-text text-transparent">
          Areas
        </h1>
        <Button className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Area
        </Button>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {areas.map((area) => (
          <motion.div key={area.id} variants={item}>
            <Card className="backdrop-blur-sm bg-white/50 hover:bg-white/60 transition-all border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FolderIcon className="h-4 w-4 text-primary" />
                  </div>
                  {area.name}
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-500 hover:text-primary"
                    onClick={() => setSelectedArea(area)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-gray-500 hover:text-red-600"
                    onClick={() => handleDelete(area.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">{area.description || 'No description'}</p>
                
                {/* Active Goals Section */}
                <div className="space-y-2">
                  {goals.filter((goal: Goal) => goal.areaId === area.id && goal.status !== 'completed').map((goal: Goal) => (
                    <div 
                      key={goal.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {goal.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {goal.description}
                        </p>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "ml-2",
                          goal.status === 'in_progress' && "bg-primary/10 text-primary hover:bg-primary/20",
                          goal.status === 'not_started' && "bg-gray-100 text-gray-500"
                        )}
                      >
                        {goal.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  {area.isFocus && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                      Focus Area
                    </Badge>
                  )}
                  {!area.isActive && (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                      Inactive
                    </Badge>
                  )}
                  {area.parentId && (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                      Sub-Area
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <CreateAreaDialog 
        open={isCreateDialogOpen} 
        onClose={() => setIsCreateDialogOpen(false)} 
      />

      {selectedArea && (
        <EditAreaDialog
          open={!!selectedArea}
          onClose={() => setSelectedArea(null)}
          area={selectedArea}
        />
      )}
    </div>
  )
}
