'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';

export function Notepad({ initialContent = '' }: { initialContent?: string }) {
  const [content, setContent] = useState(initialContent);

  return (
    <Card className="overflow-hidden backdrop-blur-sm bg-background/60 border-primary/10">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent">
          Notepad
        </h2>
        <motion.div 
          className="mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[300px] resize-none bg-background/50 border-primary/10 focus:border-primary/20 focus:ring-primary/20 placeholder:text-muted-foreground/50"
            placeholder="Write your notes here..."
          />
        </motion.div>
      </CardContent>
    </Card>
  );
}
