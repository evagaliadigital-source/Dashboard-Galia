-- Seed de Leads de Peluquerías para Galia Digital

-- LEADS HOT (🔥 Alta prioridad - Listas para cerrar)
INSERT INTO clients (business_name, contact_name, email, phone, address, city, client_status, lead_quality, subscription_status, monthly_fee, collective, notes)
VALUES 
('Peluquería Bella Vista', 'María González', 'maria@bellavista.es', '+34 612 345 678', 'Calle Mayor 45', 'Madrid', 'prospect', 'hot', 'trial', 0, 'Peluquerías Independientes', '🔥 Interesada en agenda IA. Problema con no-shows. Reunión demo agendada.'),
('Salón Élite Madrid', 'Carmen Ruiz', 'carmen@elitemadrid.es', '+34 623 456 789', 'Av. Castellana 123', 'Madrid', 'prospect', 'hot', 'trial', 0, 'Peluquerías Premium', '🔥 CEO respondió LinkedIn. Quiere automatizar WhatsApp. 5 estilistas. Budget 300€ confirmado.'),
('Studio Hair Design', 'Laura Martínez', 'laura@studiohair.com', '+34 634 567 890', 'Calle Goya 78', 'Madrid', 'prospect', 'hot', 'trial', 0, 'Peluquerías Urbanas', '🔥 Formulario web. URGENTE: pierde 2h/día en citas. Demo mañana 10:00.');

-- LEADS WARM (🟠 Media prioridad - En nurturing)
INSERT INTO clients (business_name, contact_name, email, phone, address, city, client_status, lead_quality, subscription_status, monthly_fee, collective, notes)
VALUES
('Peluquería Moderna', 'Ana López', 'ana@moderna.es', '+34 645 678 901', 'Calle Serrano 56', 'Madrid', 'prospect', 'warm', 'trial', 0, 'Peluquerías Independientes', '🟠 Click en anuncio. Abrió 3 emails. Interesada pero quiere ver ROI primero.'),
('Salón Beauty & Style', 'Patricia Torres', 'patricia@beautystyle.es', '+34 656 789 012', 'Plaza España 12', 'Barcelona', 'prospect', 'warm', 'trial', 0, 'Peluquerías Premium', '🟠 Siguió Instagram. Comentó post sobre agenda. Enviar caso éxito.'),
('Hair Studio Pro', 'Silvia Gómez', 'silvia@hairstudiopro.com', '+34 667 890 123', 'Calle Valencia 89', 'Valencia', 'prospect', 'warm', 'trial', 0, 'Peluquerías Urbanas', '🟠 Referida por cliente activo. Comparando opciones. Precio sensible.'),
('Estética Luxury', 'Rosa Fernández', 'rosa@estetica-luxury.es', '+34 678 901 234', 'Diagonal 234', 'Barcelona', 'prospect', 'warm', 'trial', 0, 'Peluquerías Premium', '🟠 Evento belleza. Tiene 3 salones. Decisión en 2 semanas.');

-- LEADS COLD (🟡 Baja prioridad - Contacto inicial)
INSERT INTO clients (business_name, contact_name, email, phone, address, city, client_status, lead_quality, subscription_status, monthly_fee, collective, notes)
VALUES
('Peluquería Los Olivos', 'Marta Sánchez', 'marta@losolivos.es', '+34 689 012 345', 'Calle Olivos 23', 'Sevilla', 'prospect', 'cold', 'trial', 0, 'Peluquerías Independientes', '🟡 Primer contacto telefónico. Sin problemas urgentes. Seguimiento 1 mes.'),
('Salón Jennifer', 'Jennifer Morales', 'jennifer@salonjennifer.com', '+34 690 123 456', 'Gran Vía 45', 'Bilbao', 'prospect', 'cold', 'trial', 0, 'Peluquerías Independientes', '🟡 Base datos. Email sin abrir. Intentar otro canal.'),
('Beauty Center Málaga', 'Isabel Jiménez', 'isabel@beautymalaga.es', '+34 601 234 567', 'Calle Larios 12', 'Málaga', 'prospect', 'cold', 'trial', 0, 'Peluquerías Urbanas', '🟡 Visitó web pero no convirtió. Remarketing activo. Interés bajo.');

-- LEADS QUALIFIED (⭐ Muy calientes - A punto de cerrar)
INSERT INTO clients (business_name, contact_name, email, phone, address, city, client_status, lead_quality, subscription_status, monthly_fee, collective, notes)
VALUES
('Peluquería VIP Salamanca', 'Cristina Vega', 'cristina@vipsalamanca.es', '+34 612 345 000', 'Calle Velázquez 89', 'Madrid', 'prospect', 'qualified', 'trial', 300, 'Peluquerías Premium', '⭐ CERRAR ESTA SEMANA. Trial activo. 100% satisfecha. Enviar contrato HOY.'),
('Studio Premium Barcelona', 'Elena Castro', 'elena@studiumpremium.es', '+34 623 456 111', 'Paseo Gracia 156', 'Barcelona', 'prospect', 'qualified', 'trial', 300, 'Peluquerías Premium', '⭐ Trial día 7/14. Recuperó 10h primera semana. Quiere contratar YA. Budget aprobado.'),
('Salón Excellence', 'Verónica Ruiz', 'veronica@excellence.com', '+34 634 567 222', 'Calle Princesa 34', 'Madrid', 'prospect', 'qualified', 'trial', 300, 'Peluquerías Premium', '⭐ CEO entusiasmada. Quiere añadir 2 salones más. Deal 900€/mes potencial.');

-- CLIENTES ACTIVOS (✅ Ya convertidos - Para referencia)
INSERT INTO clients (business_name, contact_name, email, phone, address, city, client_status, lead_quality, subscription_status, monthly_fee, collective, notes)
VALUES
('Hair & Beauty Chamberí', 'Lucía Ramírez', 'lucia@hairchamberi.es', '+34 645 678 333', 'Calle Fuencarral 112', 'Madrid', 'active', 'qualified', 'active', 60, 'Peluquerías Urbanas', '✅ Cliente activo 3 meses. MRR 60€. Muy satisfecha. Posible upsell Premium.'),
('Peluquería Glamour', 'Sandra Díaz', 'sandra@glamour.es', '+34 656 789 444', 'Calle Alcalá 234', 'Madrid', 'active', 'qualified', 'active', 60, 'Peluquerías Independientes', '✅ Cliente activo 2 meses. MRR 60€. Dio testimonio IG. Caso de éxito.');
