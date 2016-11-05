GuidePanel = Ext.extend(Ext.TabPanel, {
	activeTab: 0,
	plain: true,
	
	initComponent: function() {
		var me = this;
		
		var transTree = new Ext.tree.TreePanel({
			title: '核心对象',
			useArrows: true,
			root: new Ext.tree.AsyncTreeNode({text: 'root'}),
			loader: new Ext.tree.TreeLoader({
				dataUrl: GetUrl('system/steps.do')
			}),
			enableDD:true,
			ddGroup:'TreePanelDDGroup',
			autoScroll: true,
			animate: false,
			rootVisible: false
		});
		
		var jobTree = new Ext.tree.TreePanel({
			title: '核心对象',
			useArrows: true,
			root: new Ext.tree.AsyncTreeNode({text: 'root'}),
			loader: new Ext.tree.TreeLoader({
				dataUrl: GetUrl('system/jobentrys.do')
			}),
			enableDD:true,
			ddGroup:'TreePanelDDGroup',
			autoScroll: true,
			animate: false,
			rootVisible: false
		});
		
		this.activeCom = function(item) {
			if(item == null) {
				me.remove(transTree.getId(), false);
				me.remove(jobTree.getId(), false);
			} else if(item.getXType() == 'JobGraph') {
				me.add(jobTree);
				me.setActiveTab(jobTree.getId());
				me.remove(transTree.getId(), false);
			} else if(item.getXType() == 'TransGraph') {
				me.add(transTree);
				me.setActiveTab(transTree.getId());
				me.remove(jobTree.getId(), false);
			}
		};
		
	    jobTree.on("nodedragover", function(e){
	    	return false;
	    }); 
	    
	    transTree.on("nodedragover", function(e){
	    	return false;
	    }); 
		
	    this.items = new RepositoryManageTree({title: '资源库'});
		
	    GuidePanel.superclass.initComponent.call(this);
	}
});