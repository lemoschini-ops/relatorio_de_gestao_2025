/* Cálculos descritivos; diferenças e razões não constituem metas ou avaliação de desempenho. */
(function(root){
 const value=p=>p?.value==null?null:Number(p.value);
 function change(current,baseline){const a=value(current),b=value(baseline);return {difference:a==null||b==null?null:a-b,percent:a==null||b==null||b===0?null:(a-b)/b*100};}
 function ratio(numerator,denominator,factor=100){const n=value(numerator),d=value(denominator);return n==null||d==null||d===0?null:n/d*factor;}
 const definitions=[
 {area:'pessoas',title:'Participação docente no quadro',num:1,den:3,unit:'%',factor:100,formula:'Docentes ÷ (docentes + técnicos-administrativos) × 100',note:'Composição do quadro informado; não mede dimensionamento adequado.'},
 {area:'pessoas',title:'Técnicos por docente',num:2,den:1,unit:'Técnicos-Administrativos/docente',factor:1,formula:'Técnicos-Administrativos ÷ docentes',note:'Razão entre os totais de pessoal informados.'},
 {area:'graduacao',title:'Razão ingressantes / vagas',num:17,den:12,unit:'%',factor:100,formula:'Ingressantes ÷ vagas ofertadas × 100',note:'Pode superar 100%. Não representa taxa homologada de ocupação de vagas.'},
 {area:'orcamento',title:'Pessoal na dotação total',num:53,den:52,unit:'%',factor:100,formula:'Dotação de pessoal e encargos ÷ dotação total × 100',note:'Composição da dotação atualizada; não é execução orçamentária.'},
 {area:'orcamento',title:'Investimentos na dotação total',num:55,den:52,unit:'%',factor:100,formula:'Dotação de investimentos ÷ dotação total × 100',note:'Composição da dotação atualizada; não é execução orçamentária.'},
 {area:'extensao',title:'Participação de São Carlos',num:57,den:56,unit:'%',factor:100,formula:'Atividades de São Carlos ÷ total institucional × 100',note:'Distribuição das atividades da fonte ProEx.'},
 {area:'internacional',title:'Acordos celebrados / vigentes',num:154,den:155,unit:'%',factor:100,formula:'Acordos celebrados no ano ÷ acordos vigentes em 31/12 × 100',note:'Razão entre fluxo anual e estoque. Não representa renovação ou crescimento líquido.'},
 {area:'governanca',title:'Riscos altos e extremos',num:157,den:156,unit:'%',factor:100,formula:'(Riscos altos + extremos) ÷ riscos mapeados × 100',note:'Composição dos riscos mapeados. Não mede a eficácia dos tratamentos.'}
 ];
 function configure(data){
 const add=(area,title,num,den,formula,note)=>definitions.push({area,title,num,den,unit:'%',factor:100,formula,note});
 add('pessoas','Docentes com doutorado',data.derivedKeys.doctorate,'indicador-1','Docentes com doutorado ÷ docentes × 100','Titulação informada; RSC permanece em categoria própria.');
 add('pessoas','Técnicos-Administrativos com mestrado ou doutorado','tas-stricto','indicador-2','Técnicos-Administrativos com mestrado ou doutorado ÷ total de Técnicos-Administrativos × 100','Composição da titulação; não inclui especialização.');
 add('pessoas','Docentes com 61 anos ou mais','docentes-61mais','indicador-1','Docentes com 61 anos ou mais ÷ docentes × 100','Perfil etário; não identifica elegibilidade para aposentadoria.');
 for(const level of ['mestrado','doutorado']){const keys=data.derivedKeys.pg[level];add('pos','Defesas por 100 matrículas · '+level,keys.defesas,keys.matriculados,'Defesas no painel fixo ÷ matrículas no mesmo painel × 100','Razão anual de um recorte fixo de programas; não é taxa de conclusão por coorte.');}
 add('servicos','Moodle nos atendimentos de informática','indicador-192','indicador-205','Atendimentos Moodle ÷ total de atendimentos de informática × 100','Participação dos registros de atendimento, não de usuários únicos.');
 add('servicos','Razão de solicitações aceitas / recebidas','indicador-243','indicador-242','Solicitações aceitas no ano ÷ recebidas no ano × 100','Razão anual; não acompanha a mesma coorte de solicitações.');
 add('servicos','Certificações / inscrições em cursos abertos','sead-33','sead-32','Certificações no ano ÷ inscrições no ano × 100','Ocorrências anuais; não é taxa de conclusão por coorte nem de pessoas distintas.');
 }
 root.DashboardMath={change,ratio,definitions,configure};
})(globalThis);
