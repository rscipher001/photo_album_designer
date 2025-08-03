const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

// Get all projects
router.get('/', async (req, res) => {
  try {
    const { config } = req.app.locals;
    const projectFiles = await fs.readdir(config.projectDir);
    const projects = [];

    for (const file of projectFiles) {
      if (path.extname(file) === '.json') {
        try {
          const projectPath = path.join(config.projectDir, file);
          const projectData = await fs.readJson(projectPath);
          const stats = await fs.stat(projectPath);
          
          projects.push({
            id: projectData.id,
            name: projectData.name,
            pageCount: projectData.pages ? projectData.pages.length : 0,
            createdAt: projectData.createdAt,
            updatedAt: stats.mtime.toISOString(),
            thumbnail: projectData.thumbnail || null
          });
        } catch (err) {
          console.error(`Error reading project file ${file}:`, err);
        }
      }
    }

    // Sort by last modified date
    projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({ projects });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

// Get specific project
router.get('/:id', async (req, res) => {
  try {
    const { config } = req.app.locals;
    const projectId = req.params.id;
    const projectPath = path.join(config.projectDir, `${projectId}.json`);

    if (!await fs.pathExists(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectData = await fs.readJson(projectPath);
    res.json(projectData);

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// Create new project
router.post('/', async (req, res) => {
  try {
    const { config } = req.app.locals;
    const { name, template } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const projectId = uuidv4();
    const now = new Date().toISOString();

    const projectData = {
      id: projectId,
      name: name.trim(),
      createdAt: now,
      updatedAt: now,
      template: template || 'blank',
      pages: [{
        id: uuidv4(),
        name: 'Page 1',
        layout: {
          width: 1920,
          height: 1080,
          background: '#ffffff'
        },
        elements: []
      }],
      settings: {
        defaultPageSize: { width: 1920, height: 1080 },
        exportFormat: 'jpg',
        quality: 90
      }
    };

    const projectPath = path.join(config.projectDir, `${projectId}.json`);
    await fs.writeJson(projectPath, projectData, { spaces: 2 });

    res.status(201).json({
      success: true,
      project: projectData
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', async (req, res) => {
  try {
    const { config } = req.app.locals;
    const projectId = req.params.id;
    const projectPath = path.join(config.projectDir, `${projectId}.json`);

    if (!await fs.pathExists(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const existingProject = await fs.readJson(projectPath);
    const updatedProject = {
      ...existingProject,
      ...req.body,
      id: projectId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    await fs.writeJson(projectPath, updatedProject, { spaces: 2 });

    res.json({
      success: true,
      project: updatedProject
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { config } = req.app.locals;
    const projectId = req.params.id;
    const projectPath = path.join(config.projectDir, `${projectId}.json`);

    if (!await fs.pathExists(projectPath)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await fs.remove(projectPath);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Duplicate project
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { config } = req.app.locals;
    const sourceId = req.params.id;
    const { name } = req.body;
    const sourcePath = path.join(config.projectDir, `${sourceId}.json`);

    if (!await fs.pathExists(sourcePath)) {
      return res.status(404).json({ error: 'Source project not found' });
    }

    const sourceProject = await fs.readJson(sourcePath);
    const newId = uuidv4();
    const now = new Date().toISOString();

    const duplicatedProject = {
      ...sourceProject,
      id: newId,
      name: name || `${sourceProject.name} (Copy)`,
      createdAt: now,
      updatedAt: now
    };

    const newPath = path.join(config.projectDir, `${newId}.json`);
    await fs.writeJson(newPath, duplicatedProject, { spaces: 2 });

    res.status(201).json({
      success: true,
      project: duplicatedProject
    });

  } catch (error) {
    console.error('Duplicate project error:', error);
    res.status(500).json({ error: 'Failed to duplicate project' });
  }
});

module.exports = router;