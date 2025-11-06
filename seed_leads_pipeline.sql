-- Seed de Leads con Pipeline de Prospección para Galia Digital

-- STAGE: new_lead (📥 Nuevos Leads - Recién llegados)
INSERT INTO leads (business_name, contact_name, email, phone, city, stage, lead_quality, lead_source, estimated_value, probability, collective, notes, assigned_to)
VALUES
('Salón Belleza Total', 'Mónica Pérez', 'monica@bellezatotal.es', '+34 612 111 111', 'Madrid', 'new_lead', 'warm', 'linkedin', 300, 30, 'Peluquerías Premium', '📥 Conectó en LinkedIn. Vio post sobre agenda IA. Sin contacto aún.', 1),
('Peluquería Vanguardia', 'Beatriz Ortiz', 'beatriz@vanguardia.es', '+34 623 222 222', 'Valencia', 'new_lead', 'cold', 'website', 300, 20, 'Peluquerías Independientes', '📥 Descargó eBook. Abrió 1 email. Lead frío pero interesado en contenido.', 1),
('Hair Lounge BCN', 'Cristina Navarro', 'cristina@hairlounge.es', '+34 634 333 333', 'Barcelona', 'new_lead', 'hot', 'referral', 300, 60, 'Peluquerías Urbanas', '📥 Referida por cliente activo (Glamour). Problema urgente con dobles reservas.', 1);

-- STAGE: contacted (📞 Contactados - Primera llamada/email hecha)
INSERT INTO leads (business_name, contact_name, email, phone, city, stage, lead_quality, lead_source, estimated_value, probability, first_contact_date, last_contact_date, next_followup_date, collective, notes, assigned_to)
VALUES
('Estilistas Pro Madrid', 'Raquel Muñoz', 'raquel@estilistaspro.es', '+34 645 444 444', 'Madrid', 'contacted', 'warm', 'instagram', 300, 40, '2025-11-05', '2025-11-05', '2025-11-08', 'Peluquerías Premium', '📞 Llamada 05/11. Interesada. Quiere ver demo. Agendar para viernes.', 1),
('Beauty Lab Sevilla', 'Lorena García', 'lorena@beautylab.es', '+34 656 555 555', 'Sevilla', 'contacted', 'cold', 'google_ads', 300, 25, '2025-11-04', '2025-11-04', '2025-11-10', 'Peluquerías Urbanas', '📞 Email enviado 04/11. Sin respuesta. Enviar WhatsApp follow-up.', 1),
('Salón Tendencias', 'Alicia Romero', 'alicia@tendencias.es', '+34 667 666 666', 'Málaga', 'contacted', 'warm', 'event', 300, 35, '2025-11-03', '2025-11-05', '2025-11-09', 'Peluquerías Premium', '📞 Conocida en evento. Mostró interés. Envió info por email. Seguimiento programado.', 1);

-- STAGE: qualified (🎯 Calificados - Buenos prospectos, budget confirmado)
INSERT INTO leads (business_name, contact_name, email, phone, city, stage, lead_quality, lead_source, estimated_value, probability, first_contact_date, last_contact_date, next_followup_date, collective, notes, assigned_to)
VALUES
('Peluquería Diamante', 'Sofía Blanco', 'sofia@diamante.es', '+34 678 777 777', 'Madrid', 'qualified', 'hot', 'linkedin', 300, 70, '2025-11-01', '2025-11-05', '2025-11-07', 'Peluquerías Premium', '🎯 Budget confirmado 300€. 3 estilistas. Quiere empezar en 2 semanas. MUY CALIENTE.', 1),
('Studio Corte y Color', 'Daniela Ruiz', 'daniela@corteycolor.es', '+34 689 888 888', 'Barcelona', 'qualified', 'qualified', 'referral', 300, 65, '2025-10-28', '2025-11-04', '2025-11-06', 'Peluquerías Independientes', '🎯 Referida. Vio demo. Le encantó. Pidió propuesta formal. Decision maker confirmada.', 1);

-- STAGE: negotiation (💬 Negociación - Hablando términos)
INSERT INTO leads (business_name, contact_name, email, phone, city, stage, lead_quality, lead_source, estimated_value, probability, first_contact_date, last_contact_date, next_followup_date, collective, notes, assigned_to)
VALUES
('Salón Elegance VIP', 'Marina Santos', 'marina@elegancevip.es', '+34 690 999 999', 'Madrid', 'negotiation', 'hot', 'linkedin', 300, 80, '2025-10-25', '2025-11-05', '2025-11-07', 'Peluquerías Premium', '💬 Negociando. Quiere descuento por anual. Ofrecer 540€/año (10% desc). Cierre inminente.', 1),
('Hair Studio Elite', 'Teresa Moreno', 'teresa@hairstudioelite.es', '+34 601 000 000', 'Valencia', 'negotiation', 'qualified', 'website', 300, 75, '2025-10-20', '2025-11-04', '2025-11-06', 'Peluquerías Premium', '💬 Dudas sobre integración con su sistema actual. Demo técnica agendada. Muy interesada.', 1);

-- STAGE: proposal (📝 Propuesta Enviada - Esperando decisión)
INSERT INTO leads (business_name, contact_name, email, phone, city, stage, lead_quality, lead_source, estimated_value, probability, first_contact_date, last_contact_date, next_followup_date, expected_close_date, collective, notes, assigned_to)
VALUES
('Peluquería Luxe Madrid', 'Carolina Jiménez', 'carolina@luxemadrid.es', '+34 612 100 100', 'Madrid', 'proposal', 'qualified', 'referral', 300, 85, '2025-10-15', '2025-11-03', '2025-11-06', '2025-11-10', 'Peluquerías Premium', '📝 Propuesta enviada 03/11. CEO revisando. Follow-up viernes. 85% probabilidad cierre.', 1),
('Salón Premium BCN', 'Elena Vázquez', 'elena@premiumbcn.es', '+34 623 200 200', 'Barcelona', 'proposal', 'hot', 'instagram', 300, 90, '2025-10-18', '2025-11-04', '2025-11-06', '2025-11-08', 'Peluquerías Premium', '📝 Propuesta enviada. VERBAL YES. Esperando firma. Casi cerrado. Seguir empujando.', 1);

-- STAGE: won (✅ Ganados - Convertidos a clientes)
INSERT INTO leads (business_name, contact_name, email, phone, city, stage, lead_quality, lead_source, estimated_value, probability, first_contact_date, last_contact_date, collective, notes, assigned_to, conversion_date)
VALUES
('Hair & Beauty Chamberí', 'Lucía Ramírez', 'lucia@hairchamberi.es', '+34 645 678 333', 'Madrid', 'won', 'qualified', 'referral', 300, 100, '2025-08-01', '2025-08-15', 'Peluquerías Urbanas', '✅ GANADO 15/08. Cliente activo. MRR 60€. Caso de éxito potencial.', 1, '2025-08-15'),
('Peluquería Glamour', 'Sandra Díaz', 'sandra@glamour.es', '+34 656 789 444', 'Madrid', 'won', 'qualified', 'instagram', 300, 100, '2025-09-01', '2025-09-10', 'Peluquerías Independientes', '✅ GANADO 10/09. Cliente activo. Testimonio en IG. Embajadora de marca.', 1, '2025-09-10');

-- STAGE: lost (❌ Perdidos - No cerraron)
INSERT INTO leads (business_name, contact_name, email, phone, city, stage, lead_quality, lead_source, estimated_value, probability, first_contact_date, last_contact_date, collective, notes, assigned_to)
VALUES
('Salón Económico', 'Marta López', 'marta@economico.es', '+34 634 300 300', 'Zaragoza', 'lost', 'cold', 'cold_call', 300, 0, '2025-10-01', '2025-10-15', 'Peluquerías Independientes', '❌ PERDIDO. Precio muy alto para su presupuesto. No tiene problema urgente. Re-contactar en 6 meses.', 1),
('Beauty Low Cost', 'Inés Fernández', 'ines@beautylowcost.es', '+34 645 400 400', 'Murcia', 'lost', 'cold', 'email', 300, 0, '2025-09-20', '2025-10-05', 'Peluquerías Independientes', '❌ PERDIDO. Eligió competencia más barata. Calidad no era prioridad. Nurturing a largo plazo.', 1);
