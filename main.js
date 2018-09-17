/**********************************************
* Name: Mike Thweatt
* Class: CS340
* Due Date: 12/03/17
* Description: Webapp running a database
***********************************************/

		
var express = require('express'); //Express
var exphbs = require('express-handlebars'); //Express-Handlebars
var app = express(); //Create instance of express

//*****************************************
//Here you can pass helpers that you would normally define in registerHelpers
//and you can also define stuff like `defaultLayout` and `partialsDir`
//Source1: http://doginthehat.com.au/2012/02/comparison-block-helper-for-handlebars-templates/
//Source2: https://stackoverflow.com/questions/33979051/typeerror-handlebars-registerhelper-is-not-a-function-nodejs
var hbs = exphbs.create({
	helpers: {
		sayHello: function () { console.log("Hello World") },
		compare: function(lvalue, operator, rvalue, options){
			//console.log("lvalue: " + lvalue);
			//console.log("operator: " + operator);
			//console.log("rvalue: " + rvalue);
			
			var operators, result;
			if (arguments.length < 3) {
				throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
			}
			if (options === undefined) {
				options = rvalue;
				rvalue = operator;
				operator = "===";
			}
			operators = {
				'==': function (l, r) { return l == r; },
				'===': function (l, r) { return l === r; },
				'!=': function (l, r) { return l != r; },
				'!==': function (l, r) { return l !== r; },
				'<': function (l, r) { return l < r; },
				'>': function (l, r) { return l > r; },
				'<=': function (l, r) { return l <= r; },
				'>=': function (l, r) { return l >= r; },
				'typeof': function (l, r) { return typeof l == r; }
			};
			
			if (!operators[operator]) {
				throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
			}
			
			result = operators[operator](lvalue, rvalue);
			
			if (result) {
				return options.fn(this);
			} else {
				return options.inverse(this);
			}
		}
	},
	defaultLayout: 'main',
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
	
//Body Parser
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//MySQL
var mysql = require('./dbcon.js');
//Misc
app.set('port', 9156);
app.use(express.static('public'));





//Load homepage
app.get('/',function(req,res,next){
	res.render('home');
});


/************************************************************
*************************************************************
* START OF ATHLETE TABLE FUNCTIONS
************************************************************
************************************************************/

//Main Load athlete page (no team filter)
app.get('/athlete',function(req,res,next){
	var sqlResponse = {};
	var sql = 'SELECT id, teamName FROM team ORDER BY teamName'
	//Get list of team names and IDs
	mysql.pool.query(sql, function(err, rows, fields){
		if(err){
			console.log("Error getting team table on athlete page load");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "home";
			res.render('sqlError', sqlResponse);
		} else {
		
			//Add teams to object
			if (rows.length > 0){
				sqlResponse.teams = rows;
			}
			
			//Get list of college names and IDs
			sql = 'SELECT id, schoolName FROM college ORDER BY schoolName'
			mysql.pool.query(sql, function(err, rows, fields){
				if(err){
					console.log("Error getting college table on athlete page load");
					sqlResponse.errNumber = err.code;
					sqlResponse.errDescription = err.sqlMessage;
					sqlResponse.pageName = "home";
					res.render('sqlError', sqlResponse);
				} else {
				
					//Add teams to object
					if (rows.length > 0){
						sqlResponse.colleges = rows;
					}
				
					//Get table of athletes
					sql = 'SELECT a.id, a.lastName, a.firstName, a.jerseyNumber, t.teamName, c.schoolName ' +
							'FROM athlete a ' +
							'LEFT JOIN team t ON a.teamID = t.id ' +
							'LEFT JOIN college c ON a.collegeID = c.id ' +
							'ORDER BY t.teamName, a.lastName, a.firstName'
					mysql.pool.query(sql, function(err, rows, fields){
						if(err){
							console.log("Error getting athlete table on athlete page load");
							sqlResponse.errNumber = err.code;
							sqlResponse.errDescription = err.sqlMessage;
							sqlResponse.pageName = "home";
							res.render('sqlError', sqlResponse);
						} else {
						
							//Add athletes to object
							if (rows.length > 0){
								sqlResponse.athletes = rows;
							}
							
							//Load athlete page
							res.render('athlete', sqlResponse);
						}
					});
				}
			});
		}
	});
});

//Load athlete page with team filter
app.post('/athlete',function(req,res,next){
	var sqlResponse = {};
	sqlResponse.filter = 'yes';
	var sql = 'SELECT id, teamName FROM team ORDER BY teamName'
	//Get list of team names and IDs
	mysql.pool.query(sql, function(err, rows, fields){
		if(err){
			console.log("Error getting team table on athlete page load with team filter");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "athlete";
			res.render('sqlError', sqlResponse);
		} else {
		
			//Add teams to object
			if (rows.length > 0){
				sqlResponse.teams = rows;
			}
			
			//Get list of college names and IDs
			sql = 'SELECT id, schoolName FROM college ORDER BY schoolName'
			mysql.pool.query(sql, function(err, rows, fields){
				if(err){
					console.log("Error getting college table on athlete page load with team filter");
					sqlResponse.errNumber = err.code;
					sqlResponse.errDescription = err.sqlMessage;
					sqlResponse.pageName = "athlete";
					res.render('sqlError', sqlResponse);
				} else {
				
					//Add teams to object
					if (rows.length > 0){
						sqlResponse.colleges = rows;
					}
				
					//Get table of athletes on specified team
					if (req.body.teamID == "all"){
						sql = 'SELECT a.id, a.lastName, a.firstName, a.jerseyNumber, t.teamName, c.schoolName ' +
							'FROM athlete a ' +
							'LEFT JOIN team t ON a.teamID = t.id ' +
							'LEFT JOIN college c ON a.collegeID = c.id ' +
							'ORDER BY t.teamName, a.lastName, a.firstName'
					} else if (req.body.teamID == "none"){
						sql = 'SELECT a.id, a.lastName, a.firstName, a.jerseyNumber, t.teamName, c.schoolName ' +
							'FROM athlete a ' +
							'LEFT JOIN team t ON a.teamID = t.id ' +
							'LEFT JOIN college c ON a.collegeID = c.id ' +
							'WHERE a.teamID is NULL '+
							'ORDER BY t.teamName, a.lastName, a.firstName'
					} else {
						sql = 'SELECT a.id, a.lastName, a.firstName, a.jerseyNumber, t.teamName, c.schoolName ' +
							'FROM athlete a ' +
							'LEFT JOIN team t ON a.teamID = t.id ' +
							'LEFT JOIN college c ON a.collegeID = c.id ' +
							'WHERE a.teamID = ? ' +
							'ORDER BY t.teamName, a.lastName, a.firstName'
					}
					var values = [req.body.teamID];
					mysql.pool.query(sql, values, function(err, rows, fields){
						if(err){
							console.log("Error getting athlete table on athlete page load with team filter");
							sqlResponse.errNumber = err.code;
							sqlResponse.errDescription = err.sqlMessage;
							sqlResponse.pageName = "athlete";
							res.render('sqlError', sqlResponse);
						} else {
						
							//Add athletes to object
							if (rows.length > 0){
								sqlResponse.athletes = rows;
							}
							
							//Load athlete page
							res.render('athlete', sqlResponse);
						}
					});
				}
			});
		}
	});
});

//Input new athlete
app.post('/athleteInsert',function(req,res,next){
	var sqlResponse = {};
	var sql = 'INSERT INTO athlete (firstName, lastName, jerseyNumber, teamID, collegeID) VALUES (?,?,?,?,?)';
	var values = [req.body.firstName, req.body.lastName, req.body.jerseyNumber, 
		req.body.teamID || null, req.body.collegeID || null];
	mysql.pool.query(sql, values, function(err, rows, fields){		
		if(err){
			console.log("Error inserting into athlete");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "athlete";
			res.render('sqlError', sqlResponse);
		} else {
			res.redirect('/athlete');
		}
	});
});

//Load update athlete page
app.post('/athleteUpdateForm',function(req,res,next){
	var sqlResponse = {};
	var sql = 'SELECT a.id, a.firstName, a.lastName, a.jerseyNumber, a.teamID, a.collegeID, t.teamName, c.schoolName '+
				'FROM ((athlete a ' +
				'LEFT JOIN team t ON a.teamID = t.id) '+
				'LEFT JOIN college c ON a.collegeID = c.id) '+
				'WHERE a.id = ?';
	var values = [req.body.id];
	
	//Get requested athlete info
	mysql.pool.query(sql, values, function(err, rows, fields){
		if(err){
			console.log("Error getting athlete table on update athlete page load");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "athlete";
			res.render('sqlError', sqlResponse);
		} else {
			//Add athlete to object
			sqlResponse.athlete = rows[0];
			
			//Get list of team names and IDs
			sql = 'SELECT id, teamName FROM team ORDER BY teamName'
			mysql.pool.query(sql, function(err, rows, fields){
				if(err){
					console.log("Error getting team table on update athlete page load");
					sqlResponse.errNumber = err.code;
					sqlResponse.errDescription = err.sqlMessage;
					sqlResponse.pageName = "athlete";
					res.render('sqlError', sqlResponse);
				} else {
				
					//Add teams to object
					if (rows.length > 0){
						sqlResponse.teams = rows;
					}
					
					//Get list of college names and IDs
					sql = 'SELECT id, schoolName FROM college ORDER BY schoolName'
					mysql.pool.query(sql, function(err, rows, fields){
						if(err){
							console.log("Error getting college table on update athlete page load");
							sqlResponse.errNumber = err.code;
							sqlResponse.errDescription = err.sqlMessage;
							sqlResponse.pageName = "athlete";
							res.render('sqlError', sqlResponse);
						} else {
						
							//Add colleges to object
							if (rows.length > 0){
								sqlResponse.colleges = rows;
							}
							
							//Load update athlete page
							res.render('athleteUpdateForm', sqlResponse);
						}
					});
				}
			});
		}
	});
});

//Update selected athlete in the table
app.post('/athleteUpdateSubmit',function(req,res,next){
	var sqlResponse = {};
	var sql = 'UPDATE athlete ' +
				'SET firstName = ?, lastName = ?, jerseyNumber = ?, teamID = ?, collegeID = ? '+
				'WHERE id = ?';
	var values = [req.body.firstName, req.body.lastName, req.body.jerseyNumber, 
				req.body.teamID || null, req.body.collegeID || null, req.body.id];
			
	mysql.pool.query(sql, values, function(err, rows, fields){
		if(err){
			console.log("Error updating athlete");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "athlete";
			res.render('sqlError', sqlResponse);
		} else {
			res.redirect('/athlete');
		}
	});
});


//Delete selected athlete in the table
app.post('/athleteDelete',function(req,res,next){
	var sqlResponse = {};
	var sql = 'DELETE FROM athlete WHERE id = ?';
	var values = [req.body.id];
	mysql.pool.query(sql, values, function(err, rows, fields){
		if(err){
			console.log("Error deleting athlete");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "athlete";
			res.render('sqlError', sqlResponse);
		} else {
			
			//Delete any endorsments for this athlete
			sql = 'DELETE FROM endorsement WHERE athleteID=?';
			mysql.pool.query(sql, values, function(err, rows, fields){
				if(err){
					console.log("Error deleting athlete endorsements after deleting athlete");
					sqlResponse.errNumber = err.code;
					sqlResponse.errDescription = err.sqlMessage;
					sqlResponse.pageName = "athlete";
					res.render('sqlError', sqlResponse);
				} else {
					res.redirect('/athlete');
				}
			});
		}
	});
});



/************************************************************
*************************************************************
* START OF COACH TABLE FUNCTIONS
************************************************************
************************************************************/

//Load coach page
app.get('/coach',function(req,res,next){
	var sqlResponse = {};
	var sql = 'SELECT id, teamName FROM team'
	//Get list of team names and IDs
	mysql.pool.query(sql, function(err, rows, fields){
		if(err){
			console.log("Error getting team table on coach page load");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "home";
			res.render('sqlError', sqlResponse);
		} else {
		
			//Add teams to object
			if (rows.length > 0){
				sqlResponse.teams = rows;
			}
			
			//Get table of coaches
			sql = 'SELECT c.id, c.lastName, c.firstName, t.teamName ' +
					'FROM coach c ' +
					'LEFT JOIN team t ON c.teamID = t.id ' +
					'ORDER BY c.lastName, c.firstName'
			mysql.pool.query(sql, function(err, rows, fields){
				if(err){
					console.log("Error getting coach table on coach page load");
					sqlResponse.errNumber = err.code;
					sqlResponse.errDescription = err.sqlMessage;
					sqlResponse.pageName = "home";
					res.render('sqlError', sqlResponse);
				} else {
				
					//Add coaches to object
					if (rows.length > 0){
						sqlResponse.coaches = rows;
					}
					
					//Load coach page
					res.render('coach', sqlResponse);
				}
			});
		}
	});
});

//Input new coach
app.post('/coachInsert',function(req,res,next){
	var sqlResponse = {};
	var sql;
	var values;
	//Check if this team already had a coach, 
	//If so, remove teamID from previous coach in coach table
	if (req.body.teamID){
		sql = 'SELECT teamName, city, state, coachID FROM team WHERE id = ?';
		values = [req.body.teamID];
		mysql.pool.query(sql, values, function(err, rows, fields){
			if(err){
				console.log("Error getting coachID from team table while inputing new coach");
				sqlResponse.errNumber = err.code;
				sqlResponse.errDescription = err.sqlMessage;
				sqlResponse.pageName = "coach";
				res.render('sqlError', sqlResponse);
			} else {
				//Received a team
				if (rows.length > 0){
					sqlResponse.team = rows[0];
					//Update received coach to a null for teamID
					if (sqlResponse.team.coachID != null){
						//Get the coaches info
						sql = 'SELECT id, firstName, lastName, teamID '+
								'FROM coach '+
								'WHERE id = ?';
						values = [sqlResponse.team.coachID];
						mysql.pool.query(sql, values, function(err, rows, fields){
							if(err){
								console.log("Error getting former coach info from coach table");
								sqlResponse.errNumber = err.code;
								sqlResponse.errDescription = err.sqlMessage;
								sqlResponse.pageName = "coach";
								res.render('sqlError', sqlResponse);
							} else {
								sqlResponse.coach = rows[0];
								//Update former coaches teamID to null
								sql = 'UPDATE coach ' +
										'SET firstName = ?, lastName = ?, teamID = ? '+
										'WHERE id = ?';
								values = [sqlResponse.coach.firstName, sqlResponse.coach.lastName, 
											null, sqlResponse.coach.id];
										
								mysql.pool.query(sql, values, function(err, rows, fields){
									if(err){
										console.log("Error updating former coach teamID to null");
										sqlResponse.errNumber = err.code;
										sqlResponse.errDescription = err.sqlMessage;
										sqlResponse.pageName = "coach";
										res.render('sqlError', sqlResponse);
									} else {
										
										//Insert new coach
										sql = 'INSERT INTO coach (firstName, lastName, teamID) VALUES (?,?,?)';
										values = [req.body.firstName, req.body.lastName, req.body.teamID || null];
										mysql.pool.query(sql, values, function(err, rows, fields){
											if(err){
												console.log("Error inserting into coach after updating former coach to teamID of null");
												sqlResponse.errNumber = err.code;
												sqlResponse.errDescription = err.sqlMessage;
												sqlResponse.pageName = "coach";
												res.render('sqlError', sqlResponse);
											} else {
												sqlResponse.newCoach = rows;
												//Update team table with new coach
												sql = 'UPDATE team '+
														'SET teamName=?, city=?, state=?, coachID=? '+
														'WHERE id = ?';
												values =[sqlResponse.team.teamName, sqlResponse.team.city,
														sqlResponse.team.state, sqlResponse.newCoach.insertId, req.body.teamID];
												mysql.pool.query(sql, values, function(err, rows, fields){
													if(err){
														console.log("Error updating team's coachID after inserting new coach");
														sqlResponse.errNumber = err.code;
														sqlResponse.errDescription = err.sqlMessage;
														sqlResponse.pageName = "coach";
														res.render('sqlError', sqlResponse);
													} else {
														res.redirect('/coach');
													}
												});
											}
										});
									}
								});
							}
						});
					} else { //CoachID == Null for selected team
					
						//Insert new coach
						sql = 'INSERT INTO coach (firstName, lastName, teamID) VALUES (?,?,?)';
						values = [req.body.firstName, req.body.lastName, req.body.teamID || null];
						mysql.pool.query(sql, values, function(err, rows, fields){
							if(err){
								console.log("Error inserting into coach after team's coachID == null");
								sqlResponse.errNumber = err.code;
								sqlResponse.errDescription = err.sqlMessage;
								sqlResponse.pageName = "coach";
								res.render('sqlError', sqlResponse);
							} else {
								sqlResponse.newCoach = rows;
								//Update team table with new coach
								sql = 'UPDATE team '+
										'SET teamName=?, city=?, state=?, coachID=? '+
										'WHERE id = ?';
								values =[sqlResponse.team.teamName, sqlResponse.team.city,
										sqlResponse.team.state, sqlResponse.newCoach.insertId, req.body.teamID];
								mysql.pool.query(sql, values, function(err, rows, fields){
									if(err){
										console.log("Error updating team's coachID after inserting new coach after team's coachID == null");
										sqlResponse.errNumber = err.code;
										sqlResponse.errDescription = err.sqlMessage;
										sqlResponse.pageName = "coach";
										res.render('sqlError', sqlResponse);
									} else {
										res.redirect('/coach');
									}
								});
							}
						});
					}
				}
			}
		});
		
	} else {
		//If user did not assign a team to this coach
		//Insert new coach with no team assignment
		sql = 'INSERT INTO coach (firstName, lastName, teamID) VALUES (?,?,?)';
		values = [req.body.firstName, req.body.lastName, null];
		mysql.pool.query(sql, values, function(err, rows, fields){
			if(err){
			  console.log("Error inserting into coach");
				sqlResponse.errNumber = err.code;
				sqlResponse.errDescription = err.sqlMessage;
				sqlResponse.pageName = "coach";
				res.render('sqlError', sqlResponse);
			} else {
				res.redirect('/coach');
			}
		});
	}
});

//Load update coach page
app.post('/coachUpdateForm',function(req,res,next){
	var sqlResponse = {};
	var sql = 'SELECT c.id, c.firstName, c.lastName, c.teamID, t.teamName '+
				'FROM coach c ' +
				'LEFT JOIN team t ON c.teamID = t.id '+
				'WHERE c.id = ?';
	var values = [req.body.id];
	
	//Get requested coach info
	mysql.pool.query(sql, values, function(err, rows, fields){
		if(err){
			console.log("Error getting coach table on update coach page load");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "coach";
			res.render('sqlError', sqlResponse);
		} else {
		
			//Add coach to object
			sqlResponse.coach = rows[0];
			
			//Get list of team names and IDs
			sql = 'SELECT id, teamName FROM team'
			mysql.pool.query(sql, function(err, rows, fields){
				if(err){
					console.log("Error getting team table on coach page load");
					sqlResponse.errNumber = err.code;
					sqlResponse.errDescription = err.sqlMessage;
					sqlResponse.pageName = "coach";
					res.render('sqlError', sqlResponse);
				} else {
					//Add teams to object
					if (rows.length > 0){
						sqlResponse.teams = rows;
					}
			
					//Load update coach page
					res.render('coachUpdateForm', sqlResponse);
				}
			});
		}
	});
});

//Update selected coach in the table
app.post('/coachUpdateSubmit',function(req,res,next){
	var sqlResponse = {};
	var sql;
	var values;
	
	//First see if this coach has a different team currently
	sql = 'SELECT id, firstName, lastName, teamID FROM coach WHERE id = ?';
	values = [req.body.id];
	mysql.pool.query(sql, values, function(err, rows, fields){
		if(err){
			console.log("Error getting coach table on update coach request");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "coach";
			res.render('sqlError', sqlResponse);
		} else {
		
			//Add coach to object
			sqlResponse.currentCoach = rows[0];
			
			//If this coach already has a team, set old team to null for coachID
			if (sqlResponse.currentCoach.teamID != null){
				sql = 'SELECT id, city, state, teamName, coachID FROM team WHERE id = ?';
				values = [sqlResponse.currentCoach.teamID];
				mysql.pool.query(sql, values, function(err, rows, fields){
					if(err){
						console.log("Error getting old team from team table on update coach request");
						sqlResponse.errNumber = err.code;
						sqlResponse.errDescription = err.sqlMessage;
						sqlResponse.pageName = "coach";
						res.render('sqlError', sqlResponse);
					
					} else {
						sqlResponse.oldTeam = rows[0];
						sql = 'UPDATE team SET city = ?, state = ?, teamName = ?, coachID = null WHERE id = ?';
						values = [sqlResponse.oldTeam.city, sqlResponse.oldTeam.state, 
							sqlResponse.oldTeam.teamName, sqlResponse.oldTeam.id];
						mysql.pool.query(sql, values, function(err, rows, fields){
							if(err){
								console.log("Error updating current coaches old team to null on update coach request");
								sqlResponse.errNumber = err.code;
								sqlResponse.errDescription = err.sqlMessage;
								sqlResponse.pageName = "coach";
								res.render('sqlError', sqlResponse);
							
							} else {

								//Make sure you've selected a team for this coach
								if (req.body.teamID){
									//Check if the new team already has a coach
									sql = 'SELECT id, city, state, teamName, coachID FROM team WHERE id = ?'
									values =[req.body.teamID];
									mysql.pool.query(sql, values, function(err, rows, fields){
										if(err){
											console.log("Error getting new team info from team table on update coach request");
											sqlResponse.errNumber = err.code;
											sqlResponse.errDescription = err.sqlMessage;
											sqlResponse.pageName = "coach";
											res.render('sqlError', sqlResponse);
										
										} else {
											sqlResponse.newTeam = rows[0];
											if (sqlResponse.newTeam.coachID != null){
												//If new team already has a coach, get old coaches info
												sql = 'SELECT id, firstName, lastName, teamID FROM coach WHERE id = ?'
												values =[sqlResponse.newTeam.coachID];
												mysql.pool.query(sql, values, function(err, rows, fields){
													if(err){
														console.log("Error getting team's old coach info on update coach request");
														sqlResponse.errNumber = err.code;
														sqlResponse.errDescription = err.sqlMessage;
														sqlResponse.pageName = "coach";
														res.render('sqlError', sqlResponse);
													
													} else {
														sqlResponse.oldCoach = rows[0];
														//Update old coach to null for teamID
														sql = 'UPDATE coach SET firstName = ?, lastName = ?, '+
															'teamID = null WHERE id = ?'
														values = [sqlResponse.oldCoach.firstName, 
																	sqlResponse.oldCoach.lastName,
																	sqlResponse.oldCoach.id];
														mysql.pool.query(sql, values, function(err, rows, fields){
															if(err){
																console.log("Error updating old coaches teamID to null on update coach request");
																sqlResponse.errNumber = err.code;
																sqlResponse.errDescription = err.sqlMessage;
																sqlResponse.pageName = "coach";
																res.render('sqlError', sqlResponse);
															
															} else {
																//Update new team for current coach
																sql = 'UPDATE team SET city = ?, state =?, teamName = ?, coachID = ? '+
																		'WHERE id = ?';
																values =[sqlResponse.newTeam.city, 
																		sqlResponse.newTeam.state,
																		sqlResponse.newTeam.teamName,
																		req.body.id, req.body.teamID];
																mysql.pool.query(sql, values, function(err, rows, fields){
																	if(err){
																		console.log("Error updating new teams coachID to current coach on update coach request");
																		sqlResponse.errNumber = err.code;
																		sqlResponse.errDescription = err.sqlMessage;
																		sqlResponse.pageName = "coach";
																		res.render('sqlError', sqlResponse);
																	
																	} else {
																		//Update coach
																		sql = 'UPDATE coach SET firstName = ?, lastName = ?, '+
																				'teamID = ? WHERE id = ?'
																		values = [req.body.firstName, req.body.lastName,
																				req.body.teamID, req.body.id];
																		mysql.pool.query(sql, values, function(err, rows, fields){
																			if(err){
																				console.log("Error updating coaches info on update coach request 1");
																				sqlResponse.errNumber = err.code;
																				sqlResponse.errDescription = err.sqlMessage;
																				sqlResponse.pageName = "coach";
																				res.render('sqlError', sqlResponse);
																			} else {
																				res.redirect('/coach');
																			}
																		});
																	}
																});
															}
														});
													}
												});
														
											} else { //If no previous coach
												//Update new team for current coach
												sql = 'UPDATE team SET city = ?, state =?, teamName = ?, coachID = ? '+
														'WHERE id = ?';
												values =[sqlResponse.newTeam.city, 
														sqlResponse.newTeam.state,
														sqlResponse.newTeam.teamName,
														req.body.id, req.body.teamID];
												mysql.pool.query(sql, values, function(err, rows, fields){
													if(err){
														console.log("Error updating new teams coachID to current coach on update coach request");
														sqlResponse.errNumber = err.code;
														sqlResponse.errDescription = err.sqlMessage;
														sqlResponse.pageName = "coach";
														res.render('sqlError', sqlResponse);
													
													} else {
														//Update coach
														sql = 'UPDATE coach set firstName = ?, lastName = ?, '+
																'teamID = ? WHERE id = ?'
														values = [req.body.firstName, req.body.lastName,
																req.body.teamID, req.body.id];
														mysql.pool.query(sql, values, function(err, rows, fields){
															if(err){
																console.log("Error updating coaches info on update coach request 2");
																sqlResponse.errNumber = err.code;
																sqlResponse.errDescription = err.sqlMessage;
																sqlResponse.pageName = "coach";
																res.render('sqlError', sqlResponse);
															} else {
																res.redirect('/coach');
															}
														});
													}
												});
											}
										}
									});
									
								} else { //This coach is not getting a team assignment
									//Update coach
									sql = 'UPDATE coach set firstName = ?, lastName = ?, '+
											'teamID = null WHERE id = ?'
									values = [req.body.firstName, req.body.lastName,
											req.body.id];
									mysql.pool.query(sql, values, function(err, rows, fields){
										if(err){
											console.log("Error updating coaches info on update coach request with no team");
											sqlResponse.errNumber = err.code;
											sqlResponse.errDescription = err.sqlMessage;
											sqlResponse.pageName = "coach";
											res.render('sqlError', sqlResponse);
										} else {
											res.redirect('/coach');
										}
									});
									
								}
							}
						});
					}
				});
				
			} else { //COACH DOES NOT ALREADY HAVE A TEAM
			
				//Check if the new team already has a coach
				sql = 'SELECT id, city, state, teamName, coachID FROM team WHERE id = ?'
				values =[req.body.teamID];
				mysql.pool.query(sql, values, function(err, rows, fields){
					if(err){
						console.log("Error getting new team info from team table on update coach request");
						sqlResponse.errNumber = err.code;
						sqlResponse.errDescription = err.sqlMessage;
						sqlResponse.pageName = "coach";
						res.render('sqlError', sqlResponse);
					
					} else {
						sqlResponse.newTeam = rows[0];
						if (sqlResponse.newTeam.coachID != null){
							//If new team already has a coach, get old coaches info
							sql = 'SELECT id, firstName, lastName, teamID FROM coach WHERE id = ?'
							values =[sqlResponse.newTeam.coachID];
							mysql.pool.query(sql, values, function(err, rows, fields){
								if(err){
									console.log("Error getting team's old coach info on update coach request");
									sqlResponse.errNumber = err.code;
									sqlResponse.errDescription = err.sqlMessage;
									sqlResponse.pageName = "coach";
									res.render('sqlError', sqlResponse);
								
								} else {
									sqlResponse.oldCoach = rows[0];
									//Update old coach to null for teamID
									sql = 'UPDATE coach SET firstName = ?, lastName = ?, '+
										'teamID = null WHERE id = ?'
									values = [sqlResponse.oldCoach.firstName, 
												sqlResponse.oldCoach.lastName,
												sqlResponse.oldCoach.id];
									mysql.pool.query(sql, values, function(err, rows, fields){
										if(err){
											console.log("Error updating old coaches teamID to null on update coach request");
											sqlResponse.errNumber = err.code;
											sqlResponse.errDescription = err.sqlMessage;
											sqlResponse.pageName = "coach";
											res.render('sqlError', sqlResponse);
										
										} else {
											//Update new team for current coach
											sql = 'UPDATE team SET city = ?, state =?, teamName = ?, coachID = ? '+
													'WHERE id = ?';
											values =[sqlResponse.newTeam.city, 
													sqlResponse.newTeam.state,
													sqlResponse.newTeam.teamName,
													req.body.id, req.body.teamID];
											mysql.pool.query(sql, values, function(err, rows, fields){
												if(err){
													console.log("Error updating new teams coachID to current coach on update coach request");
													sqlResponse.errNumber = err.code;
													sqlResponse.errDescription = err.sqlMessage;
													sqlResponse.pageName = "coach";
													res.render('sqlError', sqlResponse);
												
												} else {
													//Update coach
													sql = 'UPDATE coach set firstName = ?, lastName = ?, '+
															'teamID = ? WHERE id = ?'
													values = [req.body.firstName, req.body.lastName,
															req.body.teamID, req.body.id];
													mysql.pool.query(sql, values, function(err, rows, fields){
														if(err){
															console.log("Error updating coaches info on update coach request 3");
															sqlResponse.errNumber = err.code;
															sqlResponse.errDescription = err.sqlMessage;
															sqlResponse.pageName = "coach";
															res.render('sqlError', sqlResponse);
														} else {
															res.redirect('/coach');
														}
													});
												}
											});
										}
									});
								}
							});
									
						} else { //If no previous coach
							//Update new team for current coach
							sql = 'UPDATE team SET city = ?, state =?, teamName = ?, coachID = ? '+
									'WHERE id = ?';
							values =[sqlResponse.newTeam.city, 
									sqlResponse.newTeam.state,
									sqlResponse.newTeam.teamName,
									req.body.id, req.body.teamID];
							mysql.pool.query(sql, values, function(err, rows, fields){
								if(err){
									console.log("Error updating new teams coachID to current coach on update coach request");
									sqlResponse.errNumber = err.code;
									sqlResponse.errDescription = err.sqlMessage;
									sqlResponse.pageName = "coach";
									res.render('sqlError', sqlResponse);
								
								} else {
									//Update coach
									sql = 'UPDATE coach set firstName = ?, lastName = ?, '+
											'teamID = ? WHERE id = ?'
									values = [req.body.firstName, req.body.lastName,
											req.body.teamID, req.body.id];
									mysql.pool.query(sql, values, function(err, rows, fields){
										if(err){
											console.log("Error updating coaches info on update coach request 4");
											sqlResponse.errNumber = err.code;
											sqlResponse.errDescription = err.sqlMessage;
											sqlResponse.pageName = "coach";
											res.render('sqlError', sqlResponse);
										} else {
											res.redirect('/coach');
										}
									});
								}
							});
						}
					}
				});
			}		
		}			
	});
});

//Delete selected coach in the table
app.post('/coachDelete',function(req,res,next){
	var sqlResponse = {};
	var sql = 'DELETE FROM coach ' +
				'WHERE id = ?';
	var values = [req.body.id];
	mysql.pool.query(sql, values, function(err, rows, fields){
		if(err){
			console.log("Error deleting coach");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "coach";
			res.render('sqlError', sqlResponse);
		} else {
			res.redirect('/coach');
		}
	});
});



/************************************************************
*************************************************************
* START OF TEAM TABLE FUNCTIONS
************************************************************
************************************************************/

//Load team page
app.get('/team',function(req,res,next){
	var sqlResponse = {};
	//Get list of coach names and IDs
	var sql = 'SELECT id, CONCAT(firstName, " ", lastName) AS coachName FROM coach'
	mysql.pool.query(sql, function(err, rows, fields){
		if(err){
			console.log("Error getting coach table on team page load");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "home";
			res.render('sqlError', sqlResponse);
		} else {
		
			//Add coaches to object
			if (rows.length > 0){
				sqlResponse.coaches = rows;
			}
			
			//Get table of teams
			sql = 'SELECT t.id, t.teamName, t.city, t.state, CONCAT(c.firstName, " ", c.lastName) AS coachName ' +
					'FROM team t ' +
					'LEFT JOIN coach c ON t.coachID = c.id ' +
					'ORDER BY t.teamName'
			mysql.pool.query(sql, function(err, rows, fields){
				if(err){
					console.log("Error getting team table on team page load");
					sqlResponse.errNumber = err.code;
					sqlResponse.errDescription = err.sqlMessage;
					sqlResponse.pageName = "home";
					res.render('sqlError', sqlResponse);
				} else {
				
					//Add teams to object
					if (rows.length > 0){
						sqlResponse.teams = rows;
					}
					
					//Load team page
					res.render('team', sqlResponse);
				}
			});
		}
	});
});

//Input new team
app.post('/teamInsert',function(req,res,next){
	var sqlResponse = {};
	var sql;
	var values;
	
	//Check if this new team has a coachID
	if (req.body.coachID){
		//Check if this coachID already has a teamID
		sql = 'SELECT id, firstName, lastName, teamID FROM coach where id = ?'
		values =[req.body.coachID];
		mysql.pool.query(sql, values, function(err, rows, fields){
			if(err){
				console.log("Error getting teamID from coach on teamInsert");
				sqlResponse.errNumber = err.code;
				sqlResponse.errDescription = err.sqlMessage;
				sqlResponse.pageName = "team";
				res.render('sqlError', sqlResponse);
			} else {
				sqlResponse.coach = rows[0];
				if (sqlResponse.coach.teamID != null){
					//Update old team coachID to null
					sql = 'SELECT id, city, state, teamName, coachID FROM team WHERE id = ?'
					values =[sqlResponse.coach.teamID];
					mysql.pool.query(sql, values, function(err, rows, fields){
						if(err){
							console.log("Error getting coach's old team's info on teamInsert");
							sqlResponse.errNumber = err.code;
							sqlResponse.errDescription = err.sqlMessage;
							sqlResponse.pageName = "team";
							res.render('sqlError', sqlResponse);
						} else {
							sqlResponse.oldTeam = rows[0];
							sql = 'UPDATE team SET city = ?, state = ?, teamName = ?, coachID = null '+
								'WHERE id = ?';
							values = [sqlResponse.oldTeam.city, sqlResponse.oldTeam.state, 
									sqlResponse.oldTeam.teamName, sqlResponse.coach.teamID];
							mysql.pool.query(sql, values, function(err, rows, fields){
								if(err){
									console.log("Error updating coach's old team's info on teamInsert");
									sqlResponse.errNumber = err.code;
									sqlResponse.errDescription = err.sqlMessage;
									sqlResponse.pageName = "team";
									res.render('sqlError', sqlResponse);
								} else {
									//Insert new team
									sql = 'INSERT INTO team (city, state, teamName, coachID) VALUES (?,?,?,?)';
									values = [req.body.city, req.body.state, req.body.teamName, req.body.coachID];
									mysql.pool.query(sql, values, function(err, rows, fields){
										if(err){
											console.log("Error inserting new team (with coach with former team)");
											sqlResponse.errNumber = err.code;
											sqlResponse.errDescription = err.sqlMessage;
											sqlResponse.pageName = "team";
											res.render('sqlError', sqlResponse);
										} else {
											sqlResponse.newTeam = rows;
											//Update the coaches teamID to this team
											sql = 'UPDATE coach SET firstName = ?, lastName = ?, teamID = ? WHERE id = ?';
											values =[sqlResponse.coach.firstName, sqlResponse.coach.lastName,
													sqlResponse.newTeam.insertId, req.body.coachID];
											mysql.pool.query(sql, values, function(err, rows, fields){
												if(err){
													console.log("Error updating coach's teamID to new team (with former team)");
													sqlResponse.errNumber = err.code;
													sqlResponse.errDescription = err.sqlMessage;
													sqlResponse.pageName = "team";
													res.render('sqlError', sqlResponse);
												} else {
													res.redirect('/team');
												}
											});
										}
									});
								}
							});
						}
					});
					
				} else {//No teamID for this coach
				
					//Insert new team
					sql = 'INSERT INTO team (city, state, teamName, coachID) VALUES (?,?,?,?)';
					values = [req.body.city, req.body.state, req.body.teamName, req.body.coachID];
					mysql.pool.query(sql, values, function(err, rows, fields){
						if(err){
							console.log("Error inserting new team (with coach no former team)");
							sqlResponse.errNumber = err.code;
							sqlResponse.errDescription = err.sqlMessage;
							sqlResponse.pageName = "team";
							res.render('sqlError', sqlResponse);
						} else {
							sqlResponse.newTeam = rows;
							//Update the coaches teamID to this team
							sql = 'UPDATE coach SET firstName = ?, lastName = ?, teamID = ? WHERE id = ?';
							values =[sqlResponse.coach.firstName, sqlResponse.coach.lastName,
									sqlResponse.newTeam.insertId, req.body.coachID];
							mysql.pool.query(sql, values, function(err, rows, fields){
								if(err){
									console.log("Error updating coach's teamID to new team (no former team)");
									sqlResponse.errNumber = err.code;
									sqlResponse.errDescription = err.sqlMessage;
									sqlResponse.pageName = "team";
									res.render('sqlError', sqlResponse);
								} else {
									res.redirect('/team');
								}
							});
						}
					});
				}
			}
		});
		
	} else { //No coachID

		//Insert new team
		sql = 'INSERT INTO team (city, state, teamName, coachID) VALUES (?,?,?,?)';
		values = [req.body.city, req.body.state, req.body.teamName, req.body.coachID || null];
		mysql.pool.query(sql, values, function(err, rows, fields){
			if(err){
				console.log("Error inserting into team (no coachID)");
				sqlResponse.errNumber = err.code;
				sqlResponse.errDescription = err.sqlMessage;
				sqlResponse.pageName = "team";
				res.render('sqlError', sqlResponse);
			} else {
				res.redirect('/team');
			}
		});
	}
});

//Load update team page
app.post('/teamUpdateForm',function(req,res,next){
	var sqlResponse = {};
	var sql = 'SELECT t.id, t.city, t.state, t.teamName, t.coachID, CONCAT(c.firstName, " ", c.lastName) AS coachName '+
				'FROM team t ' +
				'LEFT JOIN coach c ON t.coachID = c.id '+
				'WHERE t.id = ?';
	var values = [req.body.id];
	
	//Get requested team info
	mysql.pool.query(sql, values, function(err, rows, fields){
		if(err){
			console.log("Error getting team table on update team page load");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "team";
			res.render('sqlError', sqlResponse);
		}
		
		//Add team to object
		if (rows.length > 0){
			sqlResponse.team = rows[0];
		}
		
		//Get list of coach names and IDs
		sql = 'SELECT id, CONCAT(firstName, " ", lastName) AS coachName FROM coach'
		mysql.pool.query(sql, function(err, rows, fields){
			if(err){
				console.log("Error getting coach table on update team page load");
				sqlResponse.errNumber = err.code;
				sqlResponse.errDescription = err.sqlMessage;
				sqlResponse.pageName = "team";
				res.render('sqlError', sqlResponse);
			} else {
				//Add coaches to object
				if (rows.length > 0){
					sqlResponse.coaches = rows;
				}
		
				//Load update team page
				res.render('teamUpdateForm', sqlResponse);
			}
		});
	});
});

//Update selected team in the table
app.post('/teamUpdateSubmit',function(req,res,next){
	var sqlResponse = {};
	var sql;
	var values;
	
	//Check if coachID exists
	if (req.body.coachID){
		//Check if oldCoachID exists
		if (req.body.oldCoachID){
			
			//Check the coachID for this team
			if (req.body.coachID != req.body.oldCoachID){ //If old coachID is different than this coachID
				//Set old coach to null teamID
				sql = 'SELECT firstName, lastName, teamID FROM coach WHERE id=?'
				values =[req.body.oldCoachID];
				mysql.pool.query(sql, values, function(err, rows, fields){
					if(err){
						console.log("Error getting old coach info on updating team request");
						sqlResponse.errNumber = err.code;
						sqlResponse.errDescription = err.sqlMessage;
						sqlResponse.pageName = "team";
						res.render('sqlError', sqlResponse);
					
					} else {
						sqlResponse.oldCoach = rows[0];
						sql = 'UPDATE coach SET firstName=?, lastName=?, teamID=null WHERE id=?'
						values =[sqlResponse.oldCoach.firstName, sqlResponse.oldCoach.lastName,
								req.body.oldCoachID];
						mysql.pool.query(sql, values, function(err, rows, fields){
							if(err){
								console.log("Error updating team's old coach to null");
								sqlResponse.errNumber = err.code;
								sqlResponse.errDescription = err.sqlMessage;
								sqlResponse.pageName = "team";
								res.render('sqlError', sqlResponse);
							
							} else {
								//Set new coach to this team
								sql = 'SELECT firstName, lastName, teamID FROM coach where id=?'
								values =[req.body.coachID];
								mysql.pool.query(sql, values, function(err, rows, fields){
									if(err){
										console.log("Error getting new coaches info");
										sqlResponse.errNumber = err.code;
										sqlResponse.errDescription = err.sqlMessage;
										sqlResponse.pageName = "team";
										res.render('sqlError', sqlResponse);
									
									} else {
										sqlResponse.newCoach = rows[0];
										sql = 'UPDATE coach SET firstName=?, lastName=?, teamID=? WHERE id=?'
										values = [sqlResponse.newCoach.firstName, sqlResponse.newCoach.lastName,
													req.body.id, req.body.coachID]
										mysql.pool.query(sql, values, function(err, rows, fields){
											if(err){
												console.log("Error updating new coaches team to this team");
												sqlResponse.errNumber = err.code;
												sqlResponse.errDescription = err.sqlMessage;
												sqlResponse.pageName = "team";
												res.render('sqlError', sqlResponse);
											
											} else {
												//Set coaches old team to null
												sql = 'SELECT city, state, teamName, coachID FROM team WHERE id=?'
												values =[sqlResponse.newCoach.teamID];
												mysql.pool.query(sql, values, function(err, rows, fields){
													if(err){
														console.log("Error getting coaches old team info");
														sqlResponse.errNumber = err.code;
														sqlResponse.errDescription = err.sqlMessage;
														sqlResponse.pageName = "team";
														res.render('sqlError', sqlResponse);
													} else {
														sqlResponse.oldTeam = rows[0];
														sql = 'UPDATE team SET city=?, state=?, teamName=?, coachID=null WHERE id=?'
														values = [sqlResponse.oldTeam.city, sqlResponse.oldTeam.state,
																	sqlResponse.oldTeam.teamName, sqlResponse.newCoach.teamID];
														mysql.pool.query(sql, values, function(err, rows, fields){
															if(err){
																console.log("Error updating coaches old team info");
																sqlResponse.errNumber = err.code;
																sqlResponse.errDescription = err.sqlMessage;
																sqlResponse.pageName = "team";
																res.render('sqlError', sqlResponse);
															} else {
												
																//Update team
																sql = 'UPDATE team SET city=?, state=?, teamName=?, coachID=? WHERE id=?'
																values = [req.body.city, req.body.state, req.body.teamName,
																		req.body.coachID, req.body.id];
																mysql.pool.query(sql, values, function(err, rows, fields){
																	if(err){
																		console.log("Error updating team 1");
																		sqlResponse.errNumber = err.code;
																		sqlResponse.errDescription = err.sqlMessage;
																		sqlResponse.pageName = "team";
																		res.render('sqlError', sqlResponse);
																	} else {
																		res.redirect('/team');
																	}
																});
															}
														});
													}
												});
											}
										});
									}
								});
							}
						});
					}
				});
				
			} else { //Else coachID is the same
				//Update team
				sql = 'UPDATE team SET city=?, state=?, teamName=?, coachID=? WHERE id=?'
				values = [req.body.city, req.body.state, req.body.teamName,
						req.body.coachID, req.body.id];
				mysql.pool.query(sql, values, function(err, rows, fields){
					if(err){
						console.log("Error updating team 2 (coachID is same)");
						sqlResponse.errNumber = err.code;
						sqlResponse.errDescription = err.sqlMessage;
						sqlResponse.pageName = "team";
						res.render('sqlError', sqlResponse);
					} else {
						res.redirect('/team');
					}
				});
			}
					
					
		} else { //No old coach
			//Check if current coach has different team
			sql = 'SELECT firstName, lastName, teamID FROM coach WHERE id=?'
			values =[req.body.coachID]
			mysql.pool.query(sql, values, function(err, rows, fields){
				if(err){
					console.log("Error getting old coach info (no current coachID)");
					sqlResponse.errNumber = err.code;
					sqlResponse.errDescription = err.sqlMessage;
					sqlResponse.pageName = "team";
					res.render('sqlError', sqlResponse);
				
				} else {
					sqlResponse.newCoach = rows[0];
					//If newCoach has a former team
					if (sqlResponse.newCoach.teamID != null){
						//If newCoach's former team is not the new team
						if (sqlResponse.newCoach.teamID != req.body.id){
							//Update former team to null coachID
							sql = 'SELECT city, state, teamName, coachID FROM team WHERE id=?'
							values =[sqlResponse.newCoach.teamID];
							mysql.pool.query(sql, values, function(err, rows, fields){
								if(err){
									console.log("Error getting coaches old team info (no old coach)");
									sqlResponse.errNumber = err.code;
									sqlResponse.errDescription = err.sqlMessage;
									sqlResponse.pageName = "team";
									res.render('sqlError', sqlResponse);
								} else {
									sqlResponse.oldTeam = rows[0];
									sql = 'UPDATE team SET city=?, state=?, teamName=?, coachID=null WHERE id=?'
									values = [sqlResponse.oldTeam.city, sqlResponse.oldTeam.state,
												sqlResponse.oldTeam.teamName, sqlResponse.newCoach.teamID];
									mysql.pool.query(sql, values, function(err, rows, fields){
										if(err){
											console.log("Error updating coaches old team info (no old coach)");
											sqlResponse.errNumber = err.code;
											sqlResponse.errDescription = err.sqlMessage;
											sqlResponse.pageName = "team";
											res.render('sqlError', sqlResponse);
										} else {
											
											//Update coach to new team
											sql = 'UPDATE coach SET firstName=?, lastName=?, teamID=? WHERE id=?'
											values =[sqlResponse.newCoach.firstName, sqlResponse.newCoach.lastName,
													req.body.id, req.body.coachID];
											mysql.pool.query(sql, values, function(err, rows, fields){
												if(err){
													console.log("Error updating coach to new team (no old coach)");
													sqlResponse.errNumber = err.code;
													sqlResponse.errDescription = err.sqlMessage;
													sqlResponse.pageName = "team";
													res.render('sqlError', sqlResponse);
												} else {
							
													//Update team
													sql = 'UPDATE team SET city=?, state=?, teamName=?, coachID=? WHERE id=?'
													values = [req.body.city, req.body.state, req.body.teamName,
															req.body.coachID, req.body.id];
													mysql.pool.query(sql, values, function(err, rows, fields){
														if(err){
															console.log("Error updating team 5");
															sqlResponse.errNumber = err.code;
															sqlResponse.errDescription = err.sqlMessage;
															sqlResponse.pageName = "team";
															res.render('sqlError', sqlResponse);
														} else {
															res.redirect('/team');
														}
													});
												}
											});
										}
									});
								}
							});
							
						} else { //teamID is the same
							
							//Update team
							sql = 'UPDATE team SET city=?, state=?, teamName=?, coachID=? WHERE id=?'
							values = [req.body.city, req.body.state, req.body.teamName,
									req.body.coachID, req.body.id];
							mysql.pool.query(sql, values, function(err, rows, fields){
								if(err){
									console.log("Error updating team 5");
									sqlResponse.errNumber = err.code;
									sqlResponse.errDescription = err.sqlMessage;
									sqlResponse.pageName = "team";
									res.render('sqlError', sqlResponse);
								} else {
									res.redirect('/team');
								}
							});
						}
					
					} else { //New coach has no former team
						//Update coach to new team
						sql = 'UPDATE coach SET firstName=?, lastName=?, teamID=? WHERE id=?'
						values =[sqlResponse.newCoach.firstName, sqlResponse.newCoach.lastName,
								req.body.id, req.body.coachID];
						mysql.pool.query(sql, values, function(err, rows, fields){
							if(err){
								console.log("Error updating coach to new team (no old coach)");
								sqlResponse.errNumber = err.code;
								sqlResponse.errDescription = err.sqlMessage;
								sqlResponse.pageName = "team";
								res.render('sqlError', sqlResponse);
							} else {
		
								//Update team
								sql = 'UPDATE team SET city=?, state=?, teamName=?, coachID=? WHERE id=?'
								values = [req.body.city, req.body.state, req.body.teamName,
										req.body.coachID, req.body.id];
								mysql.pool.query(sql, values, function(err, rows, fields){
									if(err){
										console.log("Error updating team 5");
										sqlResponse.errNumber = err.code;
										sqlResponse.errDescription = err.sqlMessage;
										sqlResponse.pageName = "team";
										res.render('sqlError', sqlResponse);
									} else {
										res.redirect('/team');
									}
								});
							}
						});
					}
				}
			});
		}
		
	} else { //Else No current coachID
		//Check if old coach exists
		if (req.body.oldCoachID){
			//Set old coach to null for teamID
			sql = 'SELECT firstName, lastName, teamID FROM coach WHERE id=?'
			values = [req.body.oldCoachID];
			mysql.pool.query(sql, values, function(err, rows, fields){
				if(err){
					console.log("Error getting old coach info (no current coachID)");
					sqlResponse.errNumber = err.code;
					sqlResponse.errDescription = err.sqlMessage;
					sqlResponse.pageName = "team";
					res.render('sqlError', sqlResponse);
				
				} else {
					sqlResponse.oldCoach = rows[0];
					sql = 'UPDATE coach SET firstName=?, lastName=?, teamID=null WHERE id=?'
					values =[sqlResponse.oldCoach.firstName, sqlResponse.oldCoach.lastName, req.body.oldCoachID];
					mysql.pool.query(sql, values, function(err, rows, fields){
						if(err){
							console.log("Error updating old coach's team to null (no current coachID)");
							sqlResponse.errNumber = err.code;
							sqlResponse.errDescription = err.sqlMessage;
							sqlResponse.pageName = "team";
							res.render('sqlError', sqlResponse);
						
						} else {
							//Update team
							sql = 'UPDATE team SET city=?, state=?, teamName=?, coachID=null WHERE id=?'
							values = [req.body.city, req.body.state, req.body.teamName,
									req.body.id];
							mysql.pool.query(sql, values, function(err, rows, fields){
								if(err){
									console.log("Error updating team 3 (no current coachID)");
									sqlResponse.errNumber = err.code;
									sqlResponse.errDescription = err.sqlMessage;
									sqlResponse.pageName = "team";
									res.render('sqlError', sqlResponse);
								} else {
									res.redirect('/team');
								}
							});
						}
					});
				}
			});
		
		} else { //No previous coach
			//Update team
			sql = 'UPDATE team SET city=?, state=?, teamName=?, coachID=? WHERE id=?'
			values = [req.body.city, req.body.state, req.body.teamName,
					req.body.coachID, req.body.id];
			mysql.pool.query(sql, values, function(err, rows, fields){
				if(err){
					console.log("Error updating team 4");
					sqlResponse.errNumber = err.code;
					sqlResponse.errDescription = err.sqlMessage;
					sqlResponse.pageName = "team";
					res.render('sqlError', sqlResponse);
				} else {
					res.redirect('/team');
				}
			});
		}
	}
});

//Delete selected team in the table
app.post('/teamDelete',function(req,res,next){
	var sqlResponse = {};
	var sql = 'DELETE FROM team ' +
				'WHERE id = ?';
	var values = [req.body.id];
	mysql.pool.query(sql, values, function(err, rows, fields){
		if(err){
			console.log("Error deleting team");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "team";
			res.render('sqlError', sqlResponse);
		} else {
			res.redirect('/team');
		}
	});
});





/************************************************************
*************************************************************
* START OF COMPANY TABLE FUNCTIONS
************************************************************
************************************************************/


//Load company page
app.get('/company',function(req,res,next){
	var sqlResponse = {};
	//Get table of companies
	var sql = 'SELECT id, companyName, notes ' +
			'FROM company ' +
			'ORDER BY companyName'
	mysql.pool.query(sql, function(err, rows, fields){
		if(err){
			console.log("Error getting company table on company page load");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "home";
			res.render('sqlError', sqlResponse);
		} else {
		
			//Add teams to object
			if (rows.length > 0){
				sqlResponse.companies = rows;
			}
			
			//Load team page
			res.render('company', sqlResponse);
		}
	});
});

//Input new company
app.post('/companyInsert',function(req,res,next){
	var sqlResponse = {};
	var sql = 'INSERT INTO company (companyName, notes) VALUES (?,?)';
	var values = [req.body.companyName, req.body.notes || null];
	mysql.pool.query(sql, values, function(err, rows, fields){
		if(err){
			console.log("Error inserting into company");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "company";
			res.render('sqlError', sqlResponse);
		} else {
			res.redirect('/company');
		}
	});
});

//Load update company page
app.post('/companyUpdateForm',function(req,res,next){
	var sqlResponse = {};
	var sql = 'SELECT id, companyName, notes FROM company WHERE id = ?';
	var values = [req.body.id];
	
	//Get requested company info
	mysql.pool.query(sql, values, function(err, rows, fields){
		if(err){
			console.log("Error getting company table on update company page load");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "company";
			res.render('sqlError', sqlResponse);
		} else {
		
			//Add company to object
			if (rows.length > 0){
				sqlResponse.company = rows[0];
			}
				
			//Load company page
			res.render('companyUpdateForm', sqlResponse);
		}
	});
});

//Update selected company in the table
app.post('/companyUpdateSubmit',function(req,res,next){
	var sqlResponse = {};
	var sql = 'UPDATE company ' +
				'SET companyName = ?, notes = ? '+
				'WHERE id = ?';
	var values = [req.body.companyName, req.body.notes || null, req.body.id];
			
	mysql.pool.query(sql, values, function(err, rows, fields){
		if(err){
			console.log("Error updating company");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "company";
			res.render('sqlError', sqlResponse);
		} else {
			res.redirect('/company');
		}
	});
});

//Delete selected company in the table
app.post('/companyDelete',function(req,res,next){
	var sqlResponse = {};
	var sql = 'DELETE FROM company WHERE id = ?';
	var values = [req.body.id];
	mysql.pool.query(sql, values, function(err, rows, fields){
		if(err){
			console.log("Error deleting company");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "company";
			res.render('sqlError', sqlResponse);
		} else {
			//Delete any endorsements for this company
			sql = 'DELETE FROM endorsement WHERE companyID=?';
			mysql.pool.query(sql, values, function(err, rows, fields){
				if(err){
					console.log("Error deleting company endorsements after deleting company");
					sqlResponse.errNumber = err.code;
					sqlResponse.errDescription = err.sqlMessage;
					sqlResponse.pageName = "company";
					res.render('sqlError', sqlResponse);
				} else {
					res.redirect('/company');
				}
			});
		}
	});
});




/************************************************************
*************************************************************
* START OF ENDORSEMENT TABLE FUNCTIONS
************************************************************
************************************************************/

//Load endorsement page (no athlete/company filter)
app.get('/endorsement',function(req,res,next){
	var sqlResponse = {};
	//Get table of athletes
	var sql = 'SELECT id, CONCAT(firstName, " ", lastName) AS athleteName FROM athlete ORDER BY athleteName'
	mysql.pool.query(sql, function(err, rows, fields){
		if(err){
			console.log("Error getting athlete table on endorsement page load");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "home";
			res.render('sqlError', sqlResponse);
		} else {
			
			//Add table to object
			if (rows.length > 0){
				sqlResponse.athletes = rows;
			}
					
			//Get table of companies
			sql = 'SELECT id, companyName FROM company ORDER BY companyName'
			mysql.pool.query(sql, function(err, rows, fields){
				if(err){
					console.log("Error getting company table on endorsement page load");
					sqlResponse.errNumber = err.code;
					sqlResponse.errDescription = err.sqlMessage;
					sqlResponse.pageName = "home";
					res.render('sqlError', sqlResponse);
				} else {
					
					//Add table to object
					if (rows.length > 0){
						sqlResponse.companies = rows;
					}
						
					//Get table of endorsements
					sql = 'SELECT e.id, CONCAT(a.firstName, " ", a.lastName) AS athleteName, c.companyName ' +
							'FROM ((endorsement e ' +
							'INNER JOIN athlete a ON e.athleteID = a.id) '+
							'INNER JOIN company c ON e.companyID = c.id) '+
							'ORDER BY athleteName, companyName'
					mysql.pool.query(sql, function(err, rows, fields){
						if(err){
							console.log("Error getting endorsement table on endorsement page load");
							sqlResponse.errNumber = err.code;
							sqlResponse.errDescription = err.sqlMessage;
							sqlResponse.pageName = "home";
							res.render('sqlError', sqlResponse);
						} else {
							
							//Add table to object
							if (rows.length > 0){
								sqlResponse.endorsements = rows;
							}
							
							//Load endorsement page
							res.render('endorsement', sqlResponse);
						}
					});
				}
			});
		}
	});
});

//Load endorsement page with athlete/company filter
app.post('/endorsement',function(req,res,next){
	var sqlResponse = {};
	var values = [];
	sqlResponse.filter = 'yes';
	//Get table of athletes
	var sql = 'SELECT id, CONCAT(firstName, " ", lastName) AS athleteName FROM athlete ORDER BY athleteName'
	mysql.pool.query(sql, function(err, rows, fields){
		if(err){
			console.log("Error getting athlete table on endorsement w/ filter page load");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "home";
			res.render('sqlError', sqlResponse);
		} else {
			
			//Add table to object
			if (rows.length > 0){
				sqlResponse.athletes = rows;
			}
					
			//Get table of companies
			sql = 'SELECT id, companyName FROM company ORDER BY companyName'
			mysql.pool.query(sql, function(err, rows, fields){
				if(err){
					console.log("Error getting company table on endorsement w/ filter page load");
					sqlResponse.errNumber = err.code;
					sqlResponse.errDescription = err.sqlMessage;
					sqlResponse.pageName = "home";
					res.render('sqlError', sqlResponse);
				} else {
					
					//Add table to object
					if (rows.length > 0){
						sqlResponse.companies = rows;
					}
						
					//Get table of endorsements
					//All athletes, all companies
					if (req.body.athleteID == "allA" && req.body.companyID == "allC"){
						sql = 'SELECT e.id, CONCAT(a.firstName, " ", a.lastName) AS athleteName, c.companyName ' +
							'FROM ((endorsement e ' +
							'INNER JOIN athlete a ON e.athleteID = a.id) '+
							'INNER JOIN company c ON e.companyID = c.id) '+
							'ORDER BY athleteName, companyName'
					
					//All athletes, filtered company
					} else if (req.body.athleteID == "allA"){
						sql = 'SELECT e.id, CONCAT(a.firstName, " ", a.lastName) AS athleteName, c.companyName ' +
							'FROM ((endorsement e ' +
							'INNER JOIN athlete a ON e.athleteID = a.id) '+
							'INNER JOIN company c ON e.companyID = c.id) '+
							'WHERE c.id=?'+
							'ORDER BY athleteName, companyName'
						values = [req.body.companyID];
					
					//All companies, filtered athlete
					} else if (req.body.companyID == "allC"){
						sql = 'SELECT e.id, CONCAT(a.firstName, " ", a.lastName) AS athleteName, c.companyName ' +
							'FROM ((endorsement e ' +
							'INNER JOIN athlete a ON e.athleteID = a.id) '+
							'INNER JOIN company c ON e.companyID = c.id) '+
							'WHERE a.id=?'+
							'ORDER BY athleteName, companyName'
						values = [req.body.athleteID];
					
					//Filtered athlete and company
					} else {
						sql = 'SELECT e.id, CONCAT(a.firstName, " ", a.lastName) AS athleteName, c.companyName ' +
							'FROM ((endorsement e ' +
							'INNER JOIN athlete a ON e.athleteID = a.id) '+
							'INNER JOIN company c ON e.companyID = c.id) '+
							'WHERE a.id=? AND c.id=?'+
							'ORDER BY athleteName, companyName'
						values = [req.body.athleteID, req.body.companyID];
					}
						
					mysql.pool.query(sql, values, function(err, rows, fields){
						if(err){
							console.log("Error getting endorsement table on endorsement page load");
							sqlResponse.errNumber = err.code;
							sqlResponse.errDescription = err.sqlMessage;
							sqlResponse.pageName = "home";
							res.render('sqlError', sqlResponse);
						} else {
							
							//Add table to object
							if (rows.length > 0){
								sqlResponse.endorsements = rows;
							}
							
							//Load endorsement page
							res.render('endorsement', sqlResponse);
						}
					});
				}
			});
		}
	});
});

//Input new endorsement
app.post('/endorsementInsert',function(req,res,next){
	var sqlResponse = {};
	var sql = 'INSERT INTO endorsement (athleteID, companyID) VALUES (?,?)';
	var values = [req.body.athleteID, req.body.companyID];
	mysql.pool.query(sql, values, function(err, rows, fields){
		if(err){
			console.log("Error inserting into endorsement");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "endorsement";
			res.render('sqlError', sqlResponse);
		} else {
			res.redirect('/endorsement');
		}
	});
});

//Load update endorsement page
app.post('/endorsementUpdateForm',function(req,res,next){
	var sqlResponse = {};
	//Get table of athletes
	var sql = 'SELECT id, CONCAT(firstName, " ", lastName) AS athleteName FROM athlete ORDER BY athleteName'
	mysql.pool.query(sql, function(err, rows, fields){
		if(err){
			console.log("Error getting athlete table on update endorsement page load");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "endorsement";
			res.render('sqlError', sqlResponse);
		} else {
			
			//Add table to object
			if (rows.length > 0){
				sqlResponse.athletes = rows;
			}
					
			//Get table of companies
			sql = 'SELECT id, companyName FROM company ORDER BY companyName'
			mysql.pool.query(sql, function(err, rows, fields){
				if(err){
					console.log("Error getting company table on update endorsement page load");
					sqlResponse.errNumber = err.code;
					sqlResponse.errDescription = err.sqlMessage;
					sqlResponse.pageName = "endorsement";
					res.render('sqlError', sqlResponse);
				} else {
					
					//Add table to object
					if (rows.length > 0){
						sqlResponse.companies = rows;
					}
					
					//Get requested endorsement info
					sql = 'SELECT e.id, e.athleteID, e.companyID, CONCAT(a.firstName, " ", a.lastName) AS athleteName, '+
							'c.companyName '+
						'FROM endorsement e '+
						'INNER JOIN athlete a ON e.athleteID = a.id '+
						'INNER JOIN company c ON e.companyID = c.id '+
						'WHERE e.id = ?';
					var values = [req.body.id];
					mysql.pool.query(sql, values, function(err, rows, fields){
						if(err){
							console.log("Error getting endorsement table on update endorsement page load");
							sqlResponse.errNumber = err.code;
							sqlResponse.errDescription = err.sqlMessage;
							sqlResponse.pageName = "endorsement";
							res.render('sqlError', sqlResponse);
						} else {
							//Add table to object
							if (rows.length > 0){
								sqlResponse.endorsement = rows[0];
							}
								
							//Load endorsement update page
							res.render('endorsementUpdateForm', sqlResponse);
						}
					});
				}
			});
		}
	});
});

//Update selected endorsement in the table
app.post('/endorsementUpdateSubmit',function(req,res,next){
	var sqlResponse = {};
	var sql = 'UPDATE endorsement ' +
				'SET athleteID = ?, companyID = ? '+
				'WHERE id = ?';
	var values = [req.body.athleteID, req.body.companyID, req.body.id];
			
	mysql.pool.query(sql, values, function(err, rows, fields){
		if(err){
			console.log("Error updating endorsement");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "endorsement";
			res.render('sqlError', sqlResponse);
		} else {
			res.redirect('/endorsement');
		}
	});
});

//Delete selected endorsement in the table
app.post('/endorsementDelete',function(req,res,next){
	var sqlResponse = {};
	var sql = 'DELETE FROM endorsement ' +
				'WHERE id = ?';
	var values = [req.body.id];
	mysql.pool.query(sql, values, function(err, rows, fields){
		if(err){
			console.log("Error deleting endorsement");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "endorsement";
			res.render('sqlError', sqlResponse);
		} else {
			res.redirect('/endorsement');
		}
	});
});




/************************************************************
*************************************************************
* START OF COLLEGE TABLE FUNCTIONS
************************************************************
************************************************************/


//Load college page
app.get('/college',function(req,res,next){
	var sqlResponse = {};
	//Get table of colleges
	var sql = 'SELECT id, city, state, schoolName ' +
			'FROM college ' +
			'ORDER BY city, state'
	mysql.pool.query(sql, function(err, rows, fields){
		if(err){
			console.log("Error getting college table on college page load");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "home";
			res.render('sqlError', sqlResponse);
		} else {
		
			//Add colleges to object
			if (rows.length > 0){
				sqlResponse.colleges = rows;
			}
			
			//Load college page
			res.render('college', sqlResponse);
		}
	});
});

//Input new college
app.post('/collegeInsert',function(req,res,next){
	var sqlResponse = {};
	var sql = 'INSERT INTO college (city, state, schoolName) VALUES (?,?,?)';
	var values = [req.body.city, req.body.state, req.body.schoolName];
	mysql.pool.query(sql, values, function(err, rows, fields){
		if(err){
			console.log("Error inserting into college");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "college";
			res.render('sqlError', sqlResponse);
		} else {
			res.redirect('/college');
		}
	});
});

//Load update college page
app.post('/collegeUpdateForm',function(req,res,next){
	var sqlResponse = {};
	var sql = 'SELECT id, city, state, schoolName FROM college WHERE id = ?';
	var values = [req.body.id];
	
	//Get requested college info
	mysql.pool.query(sql, values, function(err, rows, fields){
		if(err){
			console.log("Error getting college table on update college page load");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "college";
			res.render('sqlError', sqlResponse);
		} else {
		
			//Add college to object
			if (rows.length > 0){
				sqlResponse.college = rows[0];
			}
				
			//Load college page
			res.render('collegeUpdateForm', sqlResponse);
		}
	});
});

//Update selected college in the table
app.post('/collegeUpdateSubmit',function(req,res,next){
	var sqlResponse = {};
	var sql = 'UPDATE college ' +
				'SET city = ?, state = ?, schoolName = ? '+
				'WHERE id = ?';
	var values = [req.body.city, req.body.state, req.body.schoolName, req.body.id];
			
	mysql.pool.query(sql, values, function(err, rows, fields){
		if(err){
			console.log("Error updating college");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "college";
			res.render('sqlError', sqlResponse);
		} else {
			res.redirect('/college');
		}
	});
});

//Delete selected college in the table
app.post('/collegeDelete',function(req,res,next){
	var sqlResponse = {};
	var sql = 'DELETE FROM college ' +
				'WHERE id = ?';
	var values = [req.body.id];
	mysql.pool.query(sql, values, function(err, rows, fields){
		if(err){
			console.log("Error deleting college");
			sqlResponse.errNumber = err.code;
			sqlResponse.errDescription = err.sqlMessage;
			sqlResponse.pageName = "college";
			res.render('sqlError', sqlResponse);
		} else {
			res.redirect('/college');
		}
	});
});



/************************************************************
*************************************************************
* START OF MISC FUNCTIONS
************************************************************
************************************************************/


//Error 404 - Page not found
app.use(function(req,res){
  res.status(404);
  res.render('404');
});

//Error handler	
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.type('plain/text');
  res.status(500);
  res.render('500');
});

//Start server
app.listen(app.get('port'), function(){
  console.log('Express started on http://flip1.engr.oregonstate.edu:' + app.get('port'));
  console.log('Press Ctrl-C to terminate.')
});