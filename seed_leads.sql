-- Seed de Leads de Peluquerías para Galia Digital
-- Estos son leads potenciales para el producto de Agenda Inteligente

-- Limpiar datos existentes (opcional, comentar si no quieres borrar)
-- DELETE FROM clients;

-- LEADS HOT (Alta prioridad - Listas para cerrar)
INSERT INTO clients (
  business_name, contact_name, email, phone, 
  address, city,
  client_status, lead_quality,
  subscription_status, monthly_fee,
  collective, notes
) VALUES 
(
  'Peluquería Bella Vista', 'María González', 'maria@bellavista.es', '+34 612 345 678',
  'Calle Mayor 45', 'Madrid',
  'prospect', 'hot',
  'trial', 0,
  'Peluquerías Independientes', '🔥 HOT - Interesada en agenda IA. Tiene problema con no-shows. Reunión agendada para demo.'
),
(
  'Salón Élite Madrid', 'Carmen Ruiz', 'carmen@elitemadrid.es', '+34 623 456 789',
  'Avenida Castellana 123', 'Madrid', '28046',
  'prospect', 'hot', 'linkedin',
  'trial', 0,
  'Peluquerías Premium', 'CEO respondió en LinkedIn. Quiere automatizar WhatsApp. 5 estilistas. Budget confirmado 300€.'
),
(
  'Studio Hair Design', 'Laura Martínez', 'laura@studiohair.com', '+34 634 567 890',
  'Calle Goya 78', 'Madrid', '28001',
  'prospect', 'hot', 'website',
  'trial', 0,
  'Peluquerías Urbanas', 'Rellenó formulario web. Urgente: pierde 2h/día gestionando citas. Demo mañana 10:00.'
);

-- LEADS WARM (Media prioridad - En nurturing)
INSERT INTO clients (
  business_name, contact_name, email, phone,
  address, city, postal_code,
  client_status, lead_quality, lead_source,
  subscription_status, monthly_fee,
  collective, notes
) VALUES
(
  'Peluquería Moderna', 'Ana López', 'ana@moderna.es', '+34 645 678 901',
  'Calle Serrano 56', 'Madrid', '28006',
  'prospect', 'warm', 'google_ads',
  'none', 0,
  'Peluquerías Independientes', 'Click en anuncio. Abrió 3 emails. Interesada pero quiere ver ROI primero.'
),
(
  'Salón Beauty & Style', 'Patricia Torres', 'patricia@beautystyle.es', '+34 656 789 012',
  'Plaza España 12', 'Barcelona', '08014',
  'prospect', 'warm', 'instagram',
  'none', 0,
  'Peluquerías Premium', 'Siguió en Instagram. Comentó en post sobre agenda. Enviar caso de éxito.'
),
(
  'Hair Studio Pro', 'Silvia Gómez', 'silvia@hairstudiopro.com', '+34 667 890 123',
  'Calle Valencia 89', 'Valencia', '46002',
  'prospect', 'warm', 'referral',
  'none', 0,
  'Peluquerías Urbanas', 'Referida por cliente activo. Está comparando opciones. Precio sensible.'
),
(
  'Estética Luxury', 'Rosa Fernández', 'rosa@estetica-luxury.es', '+34 678 901 234',
  'Diagonal 234', 'Barcelona', '08018',
  'prospect', 'warm', 'event',
  'none', 0,
  'Peluquerías Premium', 'Conocida en evento de belleza. Tiene 3 salones. Decisión en 2 semanas.'
);

-- LEADS COLD (Baja prioridad - Contacto inicial)
INSERT INTO clients (
  business_name, contact_name, email, phone,
  address, city, postal_code,
  client_status, lead_quality, lead_source,
  subscription_status, monthly_fee,
  collective, notes
) VALUES
(
  'Peluquería Los Olivos', 'Marta Sánchez', 'marta@losolivos.es', '+34 689 012 345',
  'Calle Olivos 23', 'Sevilla', '41001',
  'prospect', 'cold', 'cold_call',
  'none', 0,
  'Peluquerías Independientes', 'Primer contacto telefónico. Aún no tiene problemas urgentes. Seguimiento en 1 mes.'
),
(
  'Salón Jennifer', 'Jennifer Morales', 'jennifer@salonjennifer.com', '+34 690 123 456',
  'Gran Vía 45', 'Bilbao', '48001',
  'prospect', 'cold', 'database',
  'none', 0,
  'Peluquerías Independientes', 'Base de datos comprada. Email sin abrir. Intentar otro canal.'
),
(
  'Beauty Center Málaga', 'Isabel Jiménez', 'isabel@beautymalaga.es', '+34 601 234 567',
  'Calle Larios 12', 'Málaga', '29015',
  'prospect', 'cold', 'website',
  'none', 0,
  'Peluquerías Urbanas', 'Visitó web pero no convirtió. Remarketing activo. Interés bajo.'
);

-- LEADS QUALIFIED (Muy calientes - A punto de cerrar)
INSERT INTO clients (
  business_name, contact_name, email, phone,
  address, city, postal_code,
  client_status, lead_quality, lead_source,
  subscription_status, monthly_fee,
  collective, notes
) VALUES
(
  'Peluquería VIP Salamanca', 'Cristina Vega', 'cristina@vipsalamanca.es', '+34 612 345 000',
  'Calle Velázquez 89', 'Madrid', '28006',
  'prospect', 'qualified', 'referral',
  'trial', 300,
  'Peluquerías Premium', '⭐ CERRAR ESTA SEMANA. Trial activo. 100% satisfecha. Enviar contrato.'
),
(
  'Studio Premium Barcelona', 'Elena Castro', 'elena@studiumpremium.es', '+34 623 456 111',
  'Paseo Gracia 156', 'Barcelona', '08008',
  'prospect', 'qualified', 'linkedin',
  'trial', 300,
  'Peluquerías Premium', '⭐ Trial día 7/14. Recuperó 10h primera semana. Quiere contratar YA. Budget aprobado.'
),
(
  'Salón Excellence', 'Verónica Ruiz', 'veronica@excellence.com', '+34 634 567 222',
  'Calle Princesa 34', 'Madrid', '28008',
  'prospect', 'qualified', 'google_ads',
  'trial', 300,
  'Peluquerías Premium', '⭐ CEO entusiasmada. Quiere añadir 2 salones más después. Deal de 900€/mes potencial.'
);

-- CLIENTES ACTIVOS (Ya convertidos - Para referencia)
INSERT INTO clients (
  business_name, contact_name, email, phone,
  address, city, postal_code,
  client_status, lead_quality, lead_source,
  subscription_status, monthly_fee,
  collective, notes
) VALUES
(
  'Hair & Beauty Chamberí', 'Lucía Ramírez', 'lucia@hairchamberi.es', '+34 645 678 333',
  'Calle Fuencarral 112', 'Madrid', '28010',
  'active', 'qualified', 'referral',
  'active', 60,
  'Peluquerías Urbanas', '✅ Cliente activo desde hace 3 meses. MRR 60€. Muy satisfecha. Posible upsell a Premium.'
),
(
  'Peluquería Glamour', 'Sandra Díaz', 'sandra@glamour.es', '+34 656 789 444',
  'Calle Alcalá 234', 'Madrid', '28028',
  'active', 'qualified', 'instagram',
  'active', 60,
  'Peluquerías Independientes', '✅ Cliente activo 2 meses. MRR 60€. Dio testimonio en IG. Posible caso de éxito.'
);

-- Actualizar secuencia de ID
-- SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients));
