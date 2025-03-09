'use client';

import Link from 'next/link';
import { Edit, Trash2, Play, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Podcast {
  id: string;
  title: string;
  // Add other known properties
  [key: string]: string | number | boolean | null | undefined;
}

interface PodcastActionsMenuProps {
  podcast: Podcast;
}

/**
 * Client component for podcast actions menu
 * This isolates the interactive dropdown menu functionality
 */
export function PodcastActionsMenu({ podcast }: PodcastActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleDelete = async () => {
    // This would typically call a server action to delete the podcast
    if (confirm(`Are you sure you want to delete "${podcast.title}"?`)) {
      // Call delete action here
      console.log('Deleting podcast:', podcast.id);
    }
  };
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/admin/podcasts/${podcast.id}`} className="flex items-center">
            <Play className="mr-2 h-4 w-4" />
            <span>View</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/podcasts/${podcast.id}/edit`} className="flex items-center">
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-red-600 cursor-pointer" 
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 