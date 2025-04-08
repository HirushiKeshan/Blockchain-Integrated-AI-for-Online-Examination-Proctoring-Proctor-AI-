
import React, { useState } from 'react';
import { CodingInterpreter } from '../components/CodingInterpreter';
import { MCQComponent } from '../components/MCQComponent';
import { DetectionComponent } from '../components/DetectionComponent';

export const Practice = () => {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Practice Zone</h1>
      <CodingInterpreter />
      <MCQComponent />
      <DetectionComponent />
</main>
  );
};
