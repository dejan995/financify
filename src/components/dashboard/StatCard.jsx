import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const StatCard = ({ item, index }) => (
  <motion.div
    key={item.title}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3, delay: index * 0.1 }}
  >
    <Card className="glassmorphism border-indigo-500/30 hover:shadow-indigo-500/20 transition-shadow duration-300 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-300">{item.title}</CardTitle>
        <item.icon className={`h-5 w-5 ${item.color}`} />
      </CardHeader>
      <CardContent className="flex flex-col flex-grow">
        <div className="flex-grow">
          <div className="text-2xl md:text-3xl font-bold text-slate-50">{item.value}</div>
          {item.description && <p className="text-xs text-slate-400">{item.description}</p>}
        </div>
        <Button 
          variant="link" 
          className="text-xs text-indigo-400 hover:text-indigo-300 p-0 h-auto mt-1 self-start"
          onClick={item.action}
        >
          {item.actionLabel}
        </Button>
      </CardContent>
    </Card>
  </motion.div>
);

export default StatCard;