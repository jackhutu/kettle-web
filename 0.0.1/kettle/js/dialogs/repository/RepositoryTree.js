RepositoryTree = Ext.extend(Ext.tree.TreePanel, {
	
	useArrows: true,
	autoScroll: true,
	animate: false,
	rootVisible: false,
	
	includeElement: true,
	loadType: 'all',
	
	initComponent: function() {
		
	    this.root = new Ext.tree.TreeNode({id: 'place'});
	    var me = this;
	    this.on('afterlayout', function() {
	    	if(this.getEl().getHeight() < 50) return;	//确保高度已经计算完毕
	    	if(this.getRootNode().id == 'root') return;
	    	
	    	var root = new Ext.tree.AsyncTreeNode({
	    		id: 'root',
				loader: new Ext.tree.TreeLoader({
					dataUrl: GetUrl('repository/explorer.do'),
					listeners: {
						beforeload: function(l) {
							this.getEl().mask('资源库信息加载中...', 'x-mask-loading');
							l.baseParams.type = this.loadType;
							l.baseParams.includeElement = this.includeElement;
						},
						load: function(l, n) {
							n.firstChild.expand();
							this.getEl().unmask();
						},
						scope: this
					}
				})
	    	});
	    	
	    	this.setRootNode(root);
	    }, this);
		
		RepositoryTree.superclass.initComponent.call(this);
	},
	
	isTrans: function(node) {
		return node.attributes.iconCls == 'trans';
	},
	
	isJob: function(node) {
		return node.attributes.iconCls == 'job';
	},
	
	loadGraphXml: function(node, cb) {
		var url = null;
		
		if(this.isTrans(node)) {
			url = GetUrl('trans/load.do');
		} else if(this.isJob(node)) {
			url = GetUrl('job/load.do');
		}
		
		if(url != null) {
			Ext.Ajax.request({
				url: url,
				params: {objectId: node.attributes.objectId},
				method: 'POST',
				success: function(response, opts) {
					cb(node, response.responseText);
				},
				failure: failureResponse
			});
		}
		
	}
});

RepositoryManageTree = Ext.extend(RepositoryTree, {
	initComponent: function() {
		var menu = new Ext.menu.Menu({
			items: [{
				text: '打开', scope: this, handler: this.openFile
			},'-',{
	            text: '新建目录', scope: this, handler: this.newDir
	        }, {
	            iconCls: 'trans', text: '新建转换', scope: this, handler: this.newTrans
	        }, {
	            iconCls: 'job', text: '新建任务', scope: this, handler: this.newJob
	        }, '-', {
	        	text: '重命名'
	        }, {
	            iconCls: 'delete', text: '删除', scope: this, handler: this.remove
	        }]
		});
    
	    this.on('contextmenu', function(node, e) {
	    	menu.showAt(e.getXY());
	    	this.getSelectionModel().select(node);
	    }, this);
	    this.on('dblclick', this.openFile, this);
	    
	    this.tbar = [{
			text: '新建',
			menu: {
				items: [{
					iconCls: 'trans', text: '新建转换', scope: this, handler: this.newTrans
				},{
					iconCls: 'job', text: '新建任务', scope: this, handler: this.newJob
				}, '-', {
					text: '新建目录', scope: this, handler: this.newDir
				}, '-', {
					text: '打开', scope: this, handler: this.openFile
				}]
			}
		}, {
			text: '资源库管理',
			menu: {
				items: [{
					text: '连接资源库', scope: this, handler: this.connect
				}, {
					text: '断开资源库', scope: this, handler: this.disconnect
				}, '-', {
					text: '导出资源库'
				}, {
					text: '导入资源库'
				}]
			}
		}, {
			text: '调度管理',
			menu: [{
				text: '任务管理', scope: this, handler: this.jobManage
			}]
		}];
	    
	    RepositoryManageTree.superclass.initComponent.call(this);
	},
	
	connect: function() {
		var dialog = new RepositoriesDialog();
		dialog.on('loginSuccess', function() {
			dialog.close();
			this.getRootNode().removeAll(true);
			this.getRootNode().reload();
		}, this);
		dialog.show();
	},
	
	disconnect: function() {
		Ext.Ajax.request({
			url: GetUrl('repository/logout.do'),
			method: 'POST',
			scope: this,
			success: function(response) {
				var reply = Ext.decode(response.responseText);
				if(reply.success) {
					this.getRootNode().removeAll(true);
					this.getRootNode().reload();
				}
			}
		});
	},
	
	newTrans: function() {
		var sm = this.getSelectionModel(), node = sm.getSelectedNode(), me = this;
		if(node && !node.isLeaf()) {
			Ext.Msg.prompt('系统提示', '请输入转换名称:', function(btn, text){
			    if (btn == 'ok' && text != ''){
			    	Ext.Ajax.request({
						url: GetUrl('repository/createTrans.do'),
						method: 'POST',
						params: {dir: node.attributes.objectId, transName: text},
						success: function(response) {
							decodeResponse(response, function(resObj) {
								var child = new Ext.tree.TreeNode({
									id: "transaction_" + resObj.message,
									objectId: resObj.message,
									text: text,
									iconCls: 'trans',
									leaf: true
								});
								node.appendChild(child);
								sm.select(child);
								
								me.openFile();
							});
						},
						failure: failureResponse
				   });
			    	
			    }
			});
		} else {
			Ext.Msg.show({
			   title: '系统提示',
			   msg: '请选择资源库中的一个目录!',
			   buttons: Ext.Msg.OK,
			   icon: Ext.MessageBox.WARNING
			});
		}
	},
	
	newJob: function() {
		var sm = this.getSelectionModel(), me = this;
		var node = sm.getSelectedNode();
		if(node && !node.isLeaf()) {
			Ext.Msg.prompt('系统提示', '请输入任务名称:', function(btn, text){
			    if (btn == 'ok' && text != ''){
			    	Ext.Ajax.request({
						url: GetUrl('repository/createJob.do'),
						method: 'POST',
						params: {dir: node.attributes.objectId, jobName: text},
						success: function(response) {
							decodeResponse(response, function(resObj) {
								var child = new Ext.tree.TreeNode({
									id: "job_" + resObj.message,
									objectId: resObj.message,
									text: text,
									iconCls: 'job',
									leaf: true
								});
								node.appendChild(child);
								sm.select(child);
								
								me.openFile();
							});
						},
						failure: failureResponse
				   });
			    	
			    }
			});
		} else {
			Ext.Msg.show({
			   title: '系统提示',
			   msg: '请选择资源库中的一个目录!',
			   buttons: Ext.Msg.OK,
			   icon: Ext.MessageBox.WARNING
			});
		}
	},
	
	newDir: function() {
		var sm = this.getSelectionModel();
		var node = sm.getSelectedNode();
		if(node && !node.isLeaf()) {
			Ext.Msg.prompt('系统提示', '请输入目录名称:', function(btn, text){
			    if (btn == 'ok' && text != ''){
			    	Ext.Ajax.request({
						url: GetUrl('repository/createDir.do'),
						method: 'POST',
						params: {dir: node.attributes.objectId, name: text},
						success: function(response) {
							decodeResponse(response, function(resObj) {
								var child = new Ext.tree.TreeNode({
									id: "directory_" + resObj.message,
									objectId: resObj.message,
									text: text,
									children:[]
								});
								node.appendChild(child);
							});
						},
						failure: failureResponse
				   });
			    	
			    }
			});
		} else {
			Ext.Msg.show({
			   title: '系统提示',
			   msg: '请选择资源库中的一个目录!',
			   buttons: Ext.Msg.OK,
			   icon: Ext.MessageBox.WARNING
			});
		}
	},
	
	remove: function() {
    	var sm = this.getSelectionModel(), node = sm.getSelectedNode();
		if(node) {
			Ext.Msg.show({
				   title:'系统提示',
				   msg: '您确定要删除该对象吗？',
				   buttons: Ext.Msg.YESNO,
				   icon: Ext.MessageBox.WARNING,
				   fn: function(bId) {
					   if(bId == 'yes') {
						   var type = -1;
						   if(node.attributes.iconCls == 'job')
							   type = 1;
						   else if(node.attributes.iconCls == 'trans')
							   type = 0;
						   
						   Ext.Ajax.request({
								url: GetUrl('repository/drop.do'),
								method: 'POST',
								params: {id: node.attributes.objectId, type: type},
								success: function(response) {
									decodeResponse(response, function(resObj) {
										node.remove();
									});
								},
								failure: failureResponse
						   });
					   }
				   }
			});
		}
    },
	
	openFile: function() {
		var node = this.getSelectionModel().getSelectedNode(), me = this;
		if(node && node.isLeaf()) {
			Ext.getBody().mask('正在加载，请稍后...');
			this.loadGraphXml(node, function(n, xml) {
				var graphPanel = null;
				if(me.isTrans(n)) graphPanel = new TransGraph();
				else if(me.isJob(n)) graphPanel = new JobGraph();
				
				if(graphPanel != null) {
					var tabPanel = Ext.getCmp('TabPanel');
					tabPanel.add(graphPanel);
					tabPanel.setActiveTab(graphPanel.getId());
					
					var xmlDocument = mxUtils.parseXml(decodeURIComponent(xml));
					var decoder = new mxCodec(xmlDocument);
					var node = xmlDocument.documentElement;
					
					var graph = graphPanel.getGraph();
					decoder.decode(node, graph.getModel());
					
					var cell = graph.getDefaultParent();
					graphPanel.setTitle(cell.getAttribute('name'));
					graphPanel.setNode(n);
				}
				
				Ext.getBody().unmask();
			});
		} else {
			Ext.Msg.show({
			   title: '系统提示',
			   msg: '请选择资源库中的一个对象!',
			   buttons: Ext.Msg.OK,
			   icon: Ext.MessageBox.WARNING
			});
		}
	},
	
	jobManage: function() {
		var dialog = new SchedulerManageDialog();
		dialog.show();
	}
});

RepositoryExplorerWindow = Ext.extend(Ext.Window, {
	width: 400,
	height: 500,
	layout: 'border',
	modal: true,
	title: '资源库浏览',
	includeElement: true,
	type: 'transformation',	//job
	
	initComponent: function() {
		var textfield = new Ext.form.TextField({
			flex: 1
		});
		
		var tree = new RepositoryTree({region: 'center', includeElement: this.includeElement, loadType: this.type});
		
		var ok = function() {
			if(!Ext.isEmpty(textfield.getValue())) {
				var path = textfield.getValue();
				var directory = path.substring(0, path.lastIndexOf('/') + 1);
				var name = path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.'));
				this.fireEvent('ok', directory, name);
			}
		};
		
		this.items = [tree, {
			region: 'south',
			height: 30,
			layout: 'hbox',
			bodyStyle: 'padding: 3px',
			items: [textfield, {
				width: 5, border: false
			},{
				xtype: 'button', text: '确定', scope: this, handler: ok
			}]
		}];
		
		RepositoryExplorerWindow.superclass.initComponent.call(this);
		this.addEvents('ok');
		
		tree.on('click', function(node) {
			if(tree.isTrans(node) || tree.isJob(node))
				textfield.setValue(node.attributes.objectId);
			else
				textfield.setValue('');
		});
	}
});