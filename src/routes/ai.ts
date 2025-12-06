import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import type { Bindings } from '../types/database';

const app = new Hono<{ Bindings: Bindings }>();

// Apply auth middleware to all routes
app.use('*', authMiddleware);

// POST /api/ai/chat - Chat with GAL IA (OpenAI integration)
app.post('/chat', async (c) => {
  try {
    const { message, context } = await c.req.json();
    const env = c.env as any;
    const user = c.get('user');
    
    if (!message || typeof message !== 'string') {
      return c.json({ error: 'Mensaje inválido' }, 400);
    }

    // Get OpenAI API Key from environment
    const OPENAI_API_KEY = env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY no configurada');
      return c.json({ 
        error: 'GAL IA no está configurada. Contacta al administrador.' 
      }, 500);
    }

    // Prepare context summary for AI
    const contextSummary = prepareContextSummary(context);

    // Build messages for OpenAI
    const messages = [
      {
        role: 'system',
        content: `Eres GAL IA, el asistente inteligente de Galia Digital, una agencia de marketing especializada en peluquerías.

Tu personalidad:
- Charlatán pero ingenioso
- Directo y sin rodeos corporativos
- Motivador y visionario
- Usas emojis estratégicamente (no excesivos)
- Formato claro con bullets y estructura

Tu objetivo:
Ayudar a Eva (fundadora de Galia Digital) con:
🎯 Gestión de Leads & Ventas (prioridad #1)
📊 Análisis de Pipeline y conversión
💼 Gestión de proyectos y tareas
📈 Métricas y KPIs
⏰ Seguimiento y recordatorios
✨ CREAR tareas, proyectos y eventos cuando Eva te lo pida

CONTEXTO ACTUAL DEL NEGOCIO:
${contextSummary}

🔧 CAPACIDADES ESPECIALES - PUEDES CREAR COSAS:

Cuando Eva te pida crear tareas/proyectos/eventos, responde con JSON en este formato:

**PARA CREAR TAREAS:**
{
  "action": "create_tasks",
  "items": [
    {
      "title": "Llamar a Peluquería Bella Vista",
      "description": "Seguimiento propuesta comercial",
      "due_date": "2025-12-15",
      "priority": "urgent",
      "status": "pending"
    }
  ]
}

**PARA CREAR PROYECTOS:**
{
  "action": "create_projects",
  "items": [
    {
      "name": "Campaña Navidad Bella Vista",
      "description": "Campaña redes sociales diciembre",
      "status": "pending",
      "type": "marketing"
    }
  ]
}

**PARA CREAR EVENTOS:**
{
  "action": "create_events",
  "items": [
    {
      "title": "Reunión Bella Vista",
      "description": "Presentación propuesta",
      "start_date": "2025-12-15T10:00:00",
      "end_date": "2025-12-15T11:00:00",
      "event_type": "meeting"
    }
  ]
}

DETECCIÓN AUTOMÁTICA:
- Fechas: "hoy", "mañana", "15 dic", "próxima semana" → convierte a ISO date
- Prioridades: "urgente", "importante" → "urgent", resto → "high" o "medium"
- Si no especifica fecha → usa null

REGLAS DE RESPUESTA:
1. Si detectas que pide CREAR algo → responde SOLO con el JSON (sin texto adicional)
2. Si es conversación normal → máximo 200 palabras con HTML
3. Usa emojis estratégicamente
4. Si hay leads HOT, menciónalos primero
5. Da consejos accionables, no teoría

Ejemplo de buena respuesta:
🔥 <strong>PRIORIDAD MÁXIMA</strong><br><br>
Tienes <strong>3 leads HOT</strong> listos para cerrar:<br>
• Peluquería "Estilo Único" 🔴<br>
• Salón "Bella Vista" 🔴<br><br>
<strong>💡 Plan de acción:</strong><br>
1. Llamar HOY a estos 2 leads<br>
2. Seguimiento WARM esta semana<br><br>
Tu ratio de conversión está en <strong>25%</strong> - buen ritmo. Mantén el foco en los HOT.`
      },
      {
        role: 'user',
        content: message
      }
    ];

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Rápido y económico
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', errorData);
      return c.json({ 
        error: 'Error al comunicarse con OpenAI',
        details: errorData 
      }, 500);
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content;

    if (!aiMessage) {
      return c.json({ 
        error: 'No se recibió respuesta de la IA' 
      }, 500);
    }

    // Check if AI wants to create something (JSON response)
    let parsedAction = null;
    try {
      // Try to parse JSON from AI response
      const jsonMatch = aiMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedAction = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Not JSON, it's a normal message
    }

    // If AI returned an action, execute it
    if (parsedAction && parsedAction.action) {
      const result = await executeAction(parsedAction, env, user.id);
      
      return c.json({
        message: result.message,
        action: parsedAction.action,
        created: result.created,
        model: 'gpt-4o-mini',
        timestamp: new Date().toISOString()
      });
    }

    // Normal conversational response
    return c.json({
      message: aiMessage,
      model: 'gpt-4o-mini',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error en /api/ai/chat:', error);
    return c.json({ 
      error: 'Error interno del servidor',
      details: error.message 
    }, 500);
  }
});

// Execute action (create tasks, projects, events)
async function executeAction(action: any, env: any, userId: number) {
  const db = env.DB;
  const created: any[] = [];

  try {
    if (action.action === 'create_tasks' && action.items) {
      for (const task of action.items) {
        const result = await db.prepare(`
          INSERT INTO tasks (title, description, due_date, priority, status, assigned_to, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          task.title,
          task.description || null,
          task.due_date || null,
          task.priority || 'medium',
          task.status || 'pending',
          userId,
          userId
        ).run();
        
        created.push({ type: 'task', id: result.meta.last_row_id, title: task.title });
      }
      
      return {
        message: `✅ <strong>${created.length} tarea${created.length > 1 ? 's' : ''} creada${created.length > 1 ? 's' : ''} exitosamente</strong><br><br>${created.map(t => `• ${t.title}`).join('<br>')}`,
        created
      };
    }

    if (action.action === 'create_projects' && action.items) {
      for (const project of action.items) {
        const result = await db.prepare(`
          INSERT INTO projects (name, description, status, type, created_by)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          project.name,
          project.description || null,
          project.status || 'pending',
          project.type || 'other',
          userId
        ).run();
        
        created.push({ type: 'project', id: result.meta.last_row_id, name: project.name });
      }
      
      return {
        message: `✅ <strong>${created.length} proyecto${created.length > 1 ? 's' : ''} creado${created.length > 1 ? 's' : ''} exitosamente</strong><br><br>${created.map(p => `• ${p.name}`).join('<br>')}`,
        created
      };
    }

    if (action.action === 'create_events' && action.items) {
      for (const event of action.items) {
        const result = await db.prepare(`
          INSERT INTO events (title, description, start_date, end_date, event_type, created_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          event.title,
          event.description || null,
          event.start_date,
          event.end_date || event.start_date,
          event.event_type || 'meeting',
          userId
        ).run();
        
        created.push({ type: 'event', id: result.meta.last_row_id, title: event.title });
      }
      
      return {
        message: `✅ <strong>${created.length} evento${created.length > 1 ? 's' : ''} creado${created.length > 1 ? 's' : ''} exitosamente</strong><br><br>${created.map(e => `• ${e.title}`).join('<br>')}`,
        created
      };
    }

    return {
      message: '❌ Acción no reconocida',
      created: []
    };

  } catch (error: any) {
    console.error('Error ejecutando acción:', error);
    return {
      message: `❌ <strong>Error al crear:</strong> ${error.message}`,
      created: []
    };
  }
}

// Helper function to prepare context summary
function prepareContextSummary(context: any): string {
  if (!context) return 'Sin datos del dashboard disponibles.';

  let summary = '';

  // Leads analysis
  if (context.leads && Array.isArray(context.leads)) {
    const leads = context.leads;
    const hot = leads.filter((l: any) => l.stage === 'hot').length;
    const warm = leads.filter((l: any) => l.stage === 'warm').length;
    const cold = leads.filter((l: any) => l.stage === 'cold').length;
    const won = leads.filter((l: any) => l.stage === 'won').length;
    const lost = leads.filter((l: any) => l.stage === 'lost').length;

    summary += `LEADS: ${leads.length} total - ${hot} HOT 🔴, ${warm} WARM 🟠, ${cold} COLD 🟡, ${won} Ganados ✅, ${lost} Perdidos ❌\n`;
  }

  // Projects analysis
  if (context.projects && Array.isArray(context.projects)) {
    const projects = context.projects;
    const active = projects.filter((p: any) => p.status === 'in_progress').length;
    const pending = projects.filter((p: any) => p.status === 'pending').length;
    const completed = projects.filter((p: any) => p.status === 'completed').length;

    summary += `PROYECTOS: ${projects.length} total - ${active} activos, ${pending} pendientes, ${completed} completados\n`;
  }

  // Tasks analysis
  if (context.tasks && Array.isArray(context.tasks)) {
    const tasks = context.tasks;
    const urgent = tasks.filter((t: any) => t.priority === 'urgent' && t.status !== 'completed').length;
    const pending = tasks.filter((t: any) => t.status === 'pending').length;

    summary += `TAREAS: ${tasks.length} total - ${urgent} urgentes ⚠️, ${pending} pendientes\n`;
  }

  // Metrics
  if (context.metrics) {
    summary += `MÉTRICAS: ${JSON.stringify(context.metrics)}\n`;
  }

  return summary || 'Dashboard sin datos todavía.';
}

export default app;
